import React, { useState, useRef, useEffect } from 'react';
import { C, EMPTY_BUILDING, DEFAULT_SHINGLE_MATERIALS, DEFAULT_LABOR, DEFAULT_FINANCIALS,
  STATE_LABOR, STATE_FINANCIALS,
  BUILDING_CODE_WARNINGS, SCOPE_ITEMS, SCOPE_ITEMS_SHINGLE, SCOPE_ITEMS_TILE, SCOPE_ITEMS_TPO, UNIT_COSTS_TEXT, EXCLUSIONS, TPO_DEFAULT_LABOR,
  COMPANY_INFO, CONTRACT_TERMS,
  fmt, fmtInt, generateId } from '../utils/constants';
import { STATUS_CONFIG, PRICING_TIERS, MARGIN_VISIBLE_ROLES, APP_VERSION } from '../utils/constants';
import { calculateShingleMaterials, calculateBuildingCost, calculateEstimateCost, calculateTPOCost, calculateTileCost,
  calculateWastePercent, parseRoofRPDF, parseBeamAIExcel, parseShingleExcel } from '../utils/helpers';
import { uploadFile, deleteFile } from '../utils/firebase';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import SuccessScreen from '../components/SuccessScreen';
import CommentThread from '../components/CommentThread';
import RevisionHistory from '../components/RevisionHistory';
import AuditTrail from '../components/AuditTrail';
import CollaborationIndicator from '../components/CollaborationIndicator';
import CustomLineItems from '../components/CustomLineItems';
import { useToast } from '../components/Toast';

const DEMO_BUILDINGS = [
  { siteplanNum: "1", roofrNum: "1", phase: 1, totalArea: 12997, pitchedArea: 12997, predominantPitch: "4/12", wastePercent: 12, eaves: 494.4, valleys: 421.3, hips: 254.0, ridges: 265.4, rakes: 385.8, wallFlashing: 203.3, stepFlashing: 86.5, pipes: 6, dryerVents: 3 },
  { siteplanNum: "2", roofrNum: "2", phase: 1, totalArea: 16476, pitchedArea: 16476, predominantPitch: "4/12", wastePercent: 14, eaves: 756.3, valleys: 495.1, hips: 519.8, ridges: 298.6, rakes: 418.0, wallFlashing: 194.8, stepFlashing: 242.4, pipes: 8, dryerVents: 3 },
  { siteplanNum: "3", roofrNum: "3", phase: 1, totalArea: 16482, pitchedArea: 16482, predominantPitch: "4/12", wastePercent: 13, eaves: 761.9, valleys: 495.0, hips: 509.3, ridges: 303.0, rakes: 403.1, wallFlashing: 198.5, stepFlashing: 253.8, pipes: 8, dryerVents: 3 },
  { siteplanNum: "4", roofrNum: "4", phase: 1, totalArea: 12857, pitchedArea: 12857, predominantPitch: "4/12", wastePercent: 12, eaves: 506.3, valleys: 422.4, hips: 261.9, ridges: 265.9, rakes: 378.0, wallFlashing: 195.8, stepFlashing: 94.7, pipes: 6, dryerVents: 3 },
  { siteplanNum: "5", roofrNum: "5", phase: 1, totalArea: 14695, pitchedArea: 14695, predominantPitch: "4/12", wastePercent: 14, eaves: 545.3, valleys: 590.5, hips: 407.7, ridges: 298.3, rakes: 410.6, wallFlashing: 201.7, stepFlashing: 89.3, pipes: 7, dryerVents: 3 },
];

export default function EstimateWizard({ estimate, onSave, onClose, currentUser, canViewMargin, onUnsavedChange, saveRef }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [saveConfirmation, setSaveConfirmation] = useState(null);
  const [buildings, setBuildings] = useState(estimate?.buildings?.length > 0 ? estimate.buildings : []);
  const [tpoMaterials, setTpoMaterials] = useState(estimate?.tpoMaterials || []);
  const [marketState, setMarketState] = useState(estimate?.state || 'FL');
  const [estimateName, setEstimateName] = useState(estimate?.propertyName || '');
  const [estimateType, setEstimateType] = useState(estimate?.type || 'shingle');
  const [uploadStatus, setUploadStatus] = useState('');
  const [parsing, setParsing] = useState(false);
  const [proposalMode, setProposalMode] = useState('total'); // 'total' or 'itemized'
  const [uploadedFiles, setUploadedFiles] = useState(estimate?.uploadedFiles || []);
  const [dragging, setDragging] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pricingTiers, setPricingTiers] = useState({ good: null, better: null, best: null });
  const [activeTier, setActiveTier] = useState('good');
  const [tiersEnabled, setTiersEnabled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [jobForkliftCost, setJobForkliftCost] = useState(estimate?.jobForkliftCost ?? 0);
  const [jobDumpsterCost, setJobDumpsterCost] = useState(estimate?.jobDumpsterCost ?? 0);
  const [jobPermitCost, setJobPermitCost] = useState(estimate?.jobPermitCost ?? 0);
  const defaultMargin = (STATE_FINANCIALS[estimate?.state || 'FL']?.margin ?? 0.25) * 100;
  const [jobMarginPercent, setJobMarginPercent] = useState(estimate?.jobMarginPercent ?? defaultMargin);
  const defaultTaxRate = (STATE_FINANCIALS[estimate?.state || 'FL']?.taxRate ?? 0.075) * 100;
  const [jobTaxPercent, setJobTaxPercent] = useState(estimate?.jobTaxPercent ?? defaultTaxRate);
  const [warrantyEnabled, setWarrantyEnabled] = useState(estimate?.warrantyEnabled !== false);
  const [materialPriceOverrides, setMaterialPriceOverrides] = useState(estimate?.materialPriceOverrides || {});
  const fileInputRef = useRef(null);
  const isInitialRender = useRef(true);

  // Re-parse uploaded files to recover buildings/materials when data is missing
  const reparseUploadedFiles = async (files) => {
    setParsing(true);
    setUploadStatus('Re-parsing saved files to recover measurements...');
    let allBuildings = [];
    let allTpoMaterials = [];

    for (const fileRecord of files) {
      try {
        const ext = fileRecord.name.toLowerCase().split('.').pop();
        if (!fileRecord.downloadURL) continue;

        // Fetch the file from Firebase Storage
        const response = await fetch(fileRecord.downloadURL);
        const blob = await response.blob();
        const file = new File([blob], fileRecord.name, { type: blob.type });

        if (ext === 'pdf') {
          const result = await parseRoofRPDF(file);
          if (result.buildings.length > 0) {
            allBuildings = [...allBuildings, ...result.buildings];
          }
        } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
          if (estimateType === 'tpo') {
            const result = await parseBeamAIExcel(file);
            if (result.materials.length > 0) {
              allTpoMaterials = [...allTpoMaterials, ...result.materials];
            }
          } else {
            const result = await parseShingleExcel(file);
            if (result.buildings.length > 0) {
              allBuildings = [...allBuildings, ...result.buildings];
            } else {
              // Try Beam AI format
              const beamResult = await parseBeamAIExcel(file);
              if (beamResult.materials.length > 0) {
                allTpoMaterials = [...allTpoMaterials, ...beamResult.materials];
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to re-parse ${fileRecord.name}:`, err);
      }
    }

    if (allBuildings.length > 0) {
      setBuildings(allBuildings);
      setUploadStatus(`Recovered ${allBuildings.length} building(s) from saved files. Review measurements below.`);
    } else if (allTpoMaterials.length > 0) {
      setTpoMaterials(allTpoMaterials);
      setUploadStatus(`Recovered ${allTpoMaterials.length} material line items from saved files.`);
    } else {
      setUploadStatus(`${files.length} file(s) saved but could not auto-parse measurements. Try re-uploading.`);
    }
    setParsing(false);
  };

  useEffect(() => {
    if (estimate) {
      setEstimateName(estimate.propertyName || '');
      setMarketState(estimate.state || 'FL');
      setEstimateType(estimate.type || 'shingle');
      if (estimate.buildings?.length > 0) setBuildings(estimate.buildings);
      if (estimate.tpoMaterials?.length > 0) setTpoMaterials(estimate.tpoMaterials);
      setJobForkliftCost(estimate.jobForkliftCost ?? 0);
      setJobDumpsterCost(estimate.jobDumpsterCost ?? 0);
      setJobPermitCost(estimate.jobPermitCost ?? 0);
      const stateMargin = (STATE_FINANCIALS[estimate.state || 'FL']?.margin ?? 0.25) * 100;
      setJobMarginPercent(estimate.jobMarginPercent ?? stateMargin);
      const stateTax = (STATE_FINANCIALS[estimate.state || 'FL']?.taxRate ?? 0.075) * 100;
      setJobTaxPercent(estimate.jobTaxPercent ?? stateTax);
      setWarrantyEnabled(estimate.warrantyEnabled !== false);
      setMaterialPriceOverrides(estimate.materialPriceOverrides || {});
      if (estimate.uploadedFiles?.length > 0) {
        setUploadedFiles(estimate.uploadedFiles);
        setUploadStatus(`${estimate.uploadedFiles.length} file(s) saved with this estimate.`);

        // If files exist but no buildings/materials loaded, re-parse from saved files
        const hasNoData = (!estimate.buildings || estimate.buildings.length === 0) &&
                          (!estimate.tpoMaterials || estimate.tpoMaterials.length === 0);
        if (hasNoData) {
          reparseUploadedFiles(estimate.uploadedFiles);
        }
      }
    }
  }, [estimate]);

  // Get or create estimate ID for file storage path
  const estimateId = estimate?.id || useRef(generateId()).current;

  // Helper to update estimate and track changes
  const updateEstimate = (updates) => {
    const updatedEst = { ...estimate, ...updates };
    onSave?.(updatedEst);
    setHasUnsavedChanges(true);
  };

  // Audit trail logging helper
  const addAuditEntry = (action, detail = '') => {
    const entry = {
      id: generateId(),
      action,
      detail,
      userName: currentUser?.name || 'Unknown',
      userRole: currentUser?.role || 'staff_estimator',
      timestamp: new Date().toISOString(),
    };
    const trail = [...(estimate?.auditTrail || []), entry];
    updateEstimate({ auditTrail: trail });
  };

  // Helper to process a File object and handle merge/append logic
  // Compress image files before processing
  const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file) => {
    if (!file) return;

    setParsing(true);
    setUploadStatus(`Uploading & parsing ${file.name}...`);

    try {
      // Compress images before upload
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          const compressedDataUrl = await compressImage(file);
          const blob = await fetch(compressedDataUrl).then(r => r.blob());
          fileToUpload = new File([blob], file.name, { type: 'image/jpeg' });
        } catch (compressErr) {
          console.warn('Image compression failed, uploading original:', compressErr);
        }
      }

      // Upload to Firebase Storage
      const storagePath = `estimates/${estimateId}/${file.name}`;
      let downloadURL = '';
      try {
        downloadURL = await uploadFile(storagePath, fileToUpload);
      } catch (storageErr) {
        console.warn('Firebase Storage upload failed, continuing with parse only:', storageErr);
      }

      const fileRecord = {
        name: file.name,
        type: file.type,
        size: file.size,
        storagePath,
        downloadURL,
        uploadedAt: new Date().toISOString(),
      };
      setUploadedFiles(prev => {
        const existing = prev.filter(f => f.name !== file.name);
        return [...existing, fileRecord];
      });

      const ext = file.name.toLowerCase().split('.').pop();

      if (ext === 'pdf') {
        const result = await parseRoofRPDF(file);
        if (result.buildings.length > 0) {
          if (buildings.length > 0) {
            // Ask user whether to replace or append
            setConfirmDialog({
              title: 'Buildings Already Loaded',
              message: 'Buildings already loaded. Click OK to replace all, or Cancel to add new buildings to existing ones.',
              onConfirm: () => {
                setBuildings(result.buildings);
                setUploadStatus(`Parsed ${result.buildings.length} buildings from ${result.pageCount} pages. File uploaded. Review measurements below.`);
                addAuditEntry('buildings_replaced', `Replaced buildings with ${result.buildings.length} from ${file.name}`);
                setConfirmDialog(null);
              },
              onCancel: () => {
                // Append and renumber
                const newBuildings = result.buildings.map((b, idx) => ({
                  ...b,
                  siteplanNum: String(buildings.length + idx + 1),
                  roofrNum: String(buildings.length + idx + 1),
                }));
                setBuildings([...buildings, ...newBuildings]);
                setUploadStatus(`Added ${result.buildings.length} buildings from ${result.pageCount} pages (renumbered). File uploaded. Review measurements below.`);
                addAuditEntry('buildings_appended', `Added ${result.buildings.length} buildings from ${file.name}`);
                setConfirmDialog(null);
              },
            });
          } else {
            setBuildings(result.buildings);
            setUploadStatus(`Parsed ${result.buildings.length} buildings from ${result.pageCount} pages. File uploaded. Review measurements below.`);
            addAuditEntry('buildings_loaded', `Loaded ${result.buildings.length} buildings from ${file.name}`);
          }
        } else {
          setUploadStatus(`PDF parsed (${result.pageCount} pages) — file uploaded. No building data auto-detected. Add buildings manually or try uploading the matching spreadsheet export.`);
        }
      } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        if (estimateType === 'tpo') {
          const result = await parseBeamAIExcel(file);
          setTpoMaterials(result.materials);
          setUploadStatus(`Imported ${result.materials.length} material line items from ${file.name}. File uploaded.`);
        } else {
          const result = await parseShingleExcel(file);
          if (result.buildings.length > 0) {
            if (buildings.length > 0) {
              // Ask user whether to replace or append
              setConfirmDialog({
                title: 'Buildings Already Loaded',
                message: 'Buildings already loaded. Click OK to replace all, or Cancel to add new buildings to existing ones.',
                onConfirm: () => {
                  setBuildings(result.buildings);
                  setUploadStatus(`Imported ${result.buildings.length} buildings from "${result.jobName || file.name}". File uploaded.`);
                  addAuditEntry('buildings_replaced', `Replaced buildings with ${result.buildings.length} from ${file.name}`);
                  setConfirmDialog(null);
                },
                onCancel: () => {
                  // Append and renumber
                  const newBuildings = result.buildings.map((b, idx) => ({
                    ...b,
                    siteplanNum: String(buildings.length + idx + 1),
                    roofrNum: String(buildings.length + idx + 1),
                  }));
                  setBuildings([...buildings, ...newBuildings]);
                  setUploadStatus(`Added ${result.buildings.length} buildings from "${result.jobName || file.name}" (renumbered). File uploaded.`);
                  addAuditEntry('buildings_appended', `Added ${result.buildings.length} buildings from ${file.name}`);
                  setConfirmDialog(null);
                },
              });
            } else {
              setBuildings(result.buildings);
              setUploadStatus(`Imported ${result.buildings.length} buildings from "${result.jobName || file.name}". File uploaded.`);
              addAuditEntry('buildings_loaded', `Loaded ${result.buildings.length} buildings from ${file.name}`);
            }
            if (result.jobName && !estimateName) setEstimateName(result.jobName);
            if (result.companyName && !estimateName) setEstimateName(result.companyName);
          } else {
            const beamResult = await parseBeamAIExcel(file);
            if (beamResult.materials.length > 0) {
              setTpoMaterials(beamResult.materials);
              setEstimateType('tpo');
              setUploadStatus(`Detected Beam AI format — imported ${beamResult.materials.length} materials. File uploaded.`);
            } else {
              setUploadStatus(`No measurement data found. File uploaded. Ensure the file has a "Measurement Import" sheet or Beam AI TAKEOFF format.`);
            }
          }
        }
      } else {
        setUploadStatus('Unsupported file type. Upload PDF (.pdf) or Excel (.xlsx) files.');
      }
    } catch (err) {
      console.error('Parse error:', err);
      setUploadStatus(`Error: ${err.message}`);
    }

    setParsing(false);

    // Auto-save so file metadata persists to Firestore immediately
    autoSaveRef.current = true;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // Reset so same file can be re-selected
    await processFile(file);
  };

  // Auto-save effect: when autoSaveRef is flagged, save the estimate
  const autoSaveRef = useRef(false);
  useEffect(() => {
    if (autoSaveRef.current) {
      autoSaveRef.current = false;
      handleSave();
    }
  });

  const handleRemoveFile = async (fileName) => {
    const fileToRemove = uploadedFiles.find(f => f.name === fileName);
    if (fileToRemove?.storagePath) {
      try {
        await deleteFile(fileToRemove.storagePath);
      } catch (err) {
        console.warn('Could not delete file from Storage:', err);
      }
    }
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
    autoSaveRef.current = true; // persist removal to Firestore
  };

  const handleDownloadFile = (fileRecord) => {
    if (fileRecord.downloadURL) {
      window.open(fileRecord.downloadURL, '_blank');
    } else if (fileRecord.data) {
      // Legacy base64 fallback
      const a = document.createElement('a');
      a.href = fileRecord.data;
      a.download = fileRecord.name;
      a.click();
    }
  };

  const handleAddBuilding = () => {
    setBuildings([...buildings, {
      ...EMPTY_BUILDING,
      siteplanNum: String(buildings.length + 1),
      roofrNum: String(buildings.length + 1),
    }]);
  };

  const handleCopyPreviousBuilding = () => {
    if (buildings.length === 0) return handleAddBuilding();
    const last = buildings[buildings.length - 1];
    setBuildings([...buildings, {
      ...last,
      siteplanNum: String(buildings.length + 1),
      roofrNum: String(buildings.length + 1),
      pipes: 0,
      dryerVents: 0,
    }]);
  };

  const handleDeleteBuilding = (index) => {
    if (buildings.length <= 1) return;
    setConfirmDialog({
      title: 'Delete Building',
      message: `Delete Building ${buildings[index]?.siteplanNum || index + 1}? This cannot be undone.`,
      onConfirm: () => {
        const updated = buildings.filter((_, i) => i !== index);
        setBuildings(updated);
        addAuditEntry('building_deleted', `Building ${buildings[index]?.siteplanNum || index + 1} deleted`);
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleLoadDemo = () => {
    setBuildings(DEMO_BUILDINGS);
    setEstimateName('Willow Bridge');
    setUploadStatus('Loaded demo data (Willow Bridge — 5 buildings)');
  };

  // Validate form and scroll to first error
  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = firstError.querySelector('input, textarea, select');
        if (input) setTimeout(() => input.focus(), 400);
      }
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!estimateName || estimateName.trim() === '') {
      errors.estimateName = true;
    }
    if (estimateType !== 'tpo' && buildings.length === 0) {
      errors.buildings = true;
    }
    if (estimateType === 'tpo' && tpoMaterials.length === 0) {
      errors.tpoMaterials = true;
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setTimeout(() => scrollToFirstError(), 100);
    }
    return errors;
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const totalCost = getTotalCost();
      // Strip base64 data from file records — only save metadata + URLs
      const cleanFiles = uploadedFiles.map(({ data, ...rest }) => rest);
      const updated = {
        ...(estimate || { id: estimateId, status: 'unassigned', createdAt: new Date().toISOString() }),
        propertyName: estimateName || 'Untitled Estimate',
        state: marketState,
        type: estimateType,
        buildings,
        tpoMaterials,
        uploadedFiles: cleanFiles,
        totalCost,
        jobForkliftCost,
        jobDumpsterCost,
        jobPermitCost,
        jobMarginPercent,
        jobTaxPercent,
        warrantyEnabled,
        materialPriceOverrides,
        updatedAt: new Date().toISOString(),
      };
      // Add audit trail entry directly to the updated object (don't call addAuditEntry
      // which would overwrite with stale estimate prop)
      const auditEntry = {
        id: generateId(),
        action: 'estimate_saved',
        detail: `Estimate saved with total cost ${totalCost}`,
        userName: currentUser?.name || 'Unknown',
        userRole: currentUser?.role || 'staff_estimator',
        timestamp: new Date().toISOString(),
      };
      updated.auditTrail = [...(updated.auditTrail || estimate?.auditTrail || []), auditEntry];

      onSave(updated);
      setHasUnsavedChanges(false);

      // Show save confirmation
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      setSaveConfirmation(`Estimate saved at ${timeStr}`);
      showToast?.(`Estimate saved successfully`);
      setTimeout(() => setSaveConfirmation(null), 4000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving estimate: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track unsaved changes: watch for changes but skip the initial render
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    setHasUnsavedChanges(true);
  }, [buildings, tpoMaterials, estimateName, marketState, estimateType, jobForkliftCost, jobDumpsterCost, jobPermitCost, jobMarginPercent, jobTaxPercent, warrantyEnabled, materialPriceOverrides]);

  // Report unsaved state to parent (App.jsx) for nav-guard
  useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  // Expose save function to parent via ref
  useEffect(() => {
    if (saveRef) saveRef.current = handleSave;
  });

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Browser back button interception
  useEffect(() => {
    const handlePopState = (e) => {
      if (step > 1) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
        setStep(prev => prev - 1);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [step]);

  // ==================== COST CALCULATIONS ====================

  // Build materials array with any per-job price overrides applied
  const getEffectiveMaterials = () => {
    if (!materialPriceOverrides || Object.keys(materialPriceOverrides).length === 0) {
      return DEFAULT_SHINGLE_MATERIALS;
    }
    return DEFAULT_SHINGLE_MATERIALS.map(m => {
      const override = materialPriceOverrides[m.id];
      if (override != null) {
        return { ...m, prices: { ...m.prices, [marketState]: override } };
      }
      return m;
    });
  };

  const getShingleCosts = () => {
    // Use the new estimate-level calculator with job-specific equipment costs and margin
    const equipmentOverride = { forklift: jobForkliftCost, dumpster: jobDumpsterCost, permit: jobPermitCost };
    const marginDecimal = (jobMarginPercent || 25) / 100;
    const taxDecimal = (jobTaxPercent || 7.5) / 100;
    const effectiveMaterials = getEffectiveMaterials();
    const result = calculateEstimateCost(buildings, effectiveMaterials, marketState, equipmentOverride, marginDecimal, taxDecimal, warrantyEnabled, materialPriceOverrides);
    const rows = result.buildings.map((cost, i) => ({
      building: buildings[i]?.siteplanNum || String(i + 1),
      ...cost,
    }));
    return { rows, total: result.grandTotal, summary: result };
  };

  const getTPOCosts = () => {
    return calculateTPOCost(tpoMaterials, TPO_DEFAULT_LABOR, DEFAULT_FINANCIALS);
  };

  const getTileCosts = () => {
    let total = 0;
    const rows = buildings.map(b => {
      const cost = calculateTileCost(b, DEFAULT_LABOR, DEFAULT_FINANCIALS, marketState);
      total += cost.total;
      return { building: b.siteplanNum, ...cost };
    });
    return { rows, total };
  };

  const getTotalCost = () => {
    if (estimateType === 'tpo') return getTPOCosts().total;
    if (estimateType === 'tile') return getTileCosts().total;
    return getShingleCosts().total;
  };

  // ==================== COLUMN DEFS ====================

  const shingleColumns = [
    { key: 'siteplanNum', label: 'Bldg #', editable: true },
    { key: 'totalArea', label: 'Area (SF)', editable: true, type: 'number' },
    { key: 'pitchedArea', label: 'Pitched (SF)', editable: true, type: 'number' },
    { key: 'predominantPitch', label: 'Pitch', editable: true },
    { key: 'wastePercent', label: 'Waste %', editable: true, type: 'number' },
    { key: 'eaves', label: 'Eaves (LF)', editable: true, type: 'number' },
    { key: 'valleys', label: 'Valleys (LF)', editable: true, type: 'number' },
    { key: 'hips', label: 'Hips (LF)', editable: true, type: 'number' },
    { key: 'ridges', label: 'Ridges (LF)', editable: true, type: 'number' },
    { key: 'rakes', label: 'Rakes (LF)', editable: true, type: 'number' },
    { key: 'stepFlashing', label: 'Step Flash (LF)', editable: true, type: 'number' },
    { key: 'wallFlashing', label: 'Wall Flash (LF)', editable: true, type: 'number' },
    { key: 'pipes', label: 'Pipes', editable: true, type: 'number' },
    { key: 'dryerVents', label: 'Dryer Vents', editable: true, type: 'number' },
  ];

  const tpoColumns = [
    { key: 'name', label: 'Material', editable: true },
    { key: 'quantity', label: 'Qty', editable: true, type: 'number' },
    { key: 'unit', label: 'Unit', editable: true },
    { key: 'unitCost', label: 'Unit Cost', editable: true, type: 'number' },
  ];

  // ==================== CALCULATIONS RENDERER ====================

  const renderCalculations = () => {
    if (estimateType === 'tpo') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Calculations</h3>
          <p style={{ fontSize: 13, color: C.gray500 }}>TPO calculations are shown in the Pricing tab.</p>
        </div>
      );
    }

    const materials = getEffectiveMaterials();
    const stLabor = STATE_LABOR[marketState] || STATE_LABOR.FL;
    const stFin = STATE_FINANCIALS[marketState] || STATE_FINANCIALS.FL;

    // Build the list of material items for the editable price table (filtered by state)
    const editableMaterialItems = DEFAULT_SHINGLE_MATERIALS
      .filter(m => !(m.stateExclude && m.stateExclude.includes(marketState)))
      .map(m => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        defaultPrice: m.prices[marketState] || 0,
        currentPrice: materialPriceOverrides[m.id] ?? m.prices[marketState] ?? 0,
      }));
    // Add OSB and Labor as editable rows
    const laborItem = {
      id: 'labor',
      name: 'Install Labor (per SQ)',
      unit: 'SQ',
      defaultPrice: stLabor.laborPerSquare,
      currentPrice: materialPriceOverrides['labor'] ?? stLabor.laborPerSquare,
    };
    const osbItem = {
      id: 'osb',
      name: 'OSB Decking',
      unit: 'SHT',
      defaultPrice: stLabor.osbPerSheet,
      currentPrice: materialPriceOverrides['osb'] ?? stLabor.osbPerSheet,
    };
    const warrantyItem = {
      id: 'warranty',
      name: 'Warranty (per SQ)',
      unit: 'SQ',
      defaultPrice: stLabor.warrantyPerSq,
      currentPrice: materialPriceOverrides['warranty'] ?? stLabor.warrantyPerSq,
    };

    // Effective labor/osb/warranty prices (with overrides)
    const effLaborPerSq = materialPriceOverrides['labor'] ?? stLabor.laborPerSquare;
    const effOsbPerSheet = materialPriceOverrides['osb'] ?? stLabor.osbPerSheet;
    const effWarrantyPerSq = materialPriceOverrides['warranty'] ?? stLabor.warrantyPerSq;

    // Material row definitions matching spreadsheet "Total Cost Calc" tab
    const getMaterialRows = (qty, state) => {
      const prices = {};
      materials.forEach(m => { prices[m.id] = m.prices[state] || 0; });

      const rows = [
        { name: 'Architectural Shingles', qty: qty.shingleBundles, unit: 'BNDL', price: prices.m1 },
        { name: 'Hip and Ridge', qty: qty.hipRidgeBundles, unit: 'BNDL', price: prices.m2 },
        { name: 'Starter Strip', qty: qty.starterBundles, unit: 'BNDL', price: prices.m3 },
        { name: 'Synthetic Underlayment', qty: qty.syntheticRolls, unit: 'ROLL', price: prices.m4 },
        { name: 'Ice and Water Shield', qty: qty.iceWaterRolls, unit: 'ROLL', price: prices.m5 },
        { name: 'Ridge Vent', qty: qty.ridgeVentCount, unit: 'EA', price: prices.m6 },
      ];
      if (state === 'FL') {
        rows.push({ name: 'Off-Ridge Vents', qty: qty.offRidgeVents, unit: 'EA', price: prices.m7 });
      }
      rows.push(
        { name: 'Step Flashing', qty: qty.stepFlashingBoxes, unit: 'BOX', price: prices.m8 },
        { name: 'Drip Edge', qty: qty.dripEdgeCount, unit: 'EA', price: prices.m9 },
        { name: 'Coil Nails', qty: qty.coilNailBoxes, unit: 'BOX', price: prices.m10 },
        { name: 'Cap Nails', qty: qty.capNailBoxes, unit: 'BOX', price: prices.m11 },
        { name: 'Pipe Boots', qty: qty.pipeBoots, unit: 'EA', price: prices.m12 },
      );
      if (state === 'FL') {
        rows.push({ name: 'Roof Cement', qty: qty.roofCement, unit: 'BCKT', price: prices.m13 });
      }
      rows.push(
        { name: 'Touch Paint', qty: qty.touchPaint, unit: 'EA', price: prices.m14 },
        { name: 'NP1', qty: qty.np1, unit: 'EA', price: prices.m15 },
        { name: 'OSB Decking (5% est.)', qty: qty.osbSheets, unit: 'SHT', price: effOsbPerSheet },
      );
      return rows;
    };

    // For tile estimates
    const getTileCalcRows = (building) => {
      const { totalArea, wastePercent = 15, ridges = 0, hips = 0 } = building;
      const adjustedArea = totalArea * (1 + wastePercent / 100);
      const squares = adjustedArea / 100;
      const tilePerSq = 90;
      return [
        { name: 'Roof Tiles', qty: Math.ceil(squares * tilePerSq), unit: 'EA', price: 2.85 },
        { name: 'Ridge/Hip Tiles', qty: Math.ceil(ridges + hips), unit: 'LF', price: 4.50 },
        { name: 'Underlayment', qty: Math.ceil(adjustedArea / 1000), unit: 'ROLL', price: 60 },
        { name: 'Battens', qty: Math.round(squares * 18), unit: 'EA', price: 1.25 },
      ];
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── Editable Unit Costs ── */}
        {estimateType === 'shingle' && (
          <div style={{ border: `1px solid ${C.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ backgroundColor: C.navy, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>Unit Costs — {marketState}</span>
              {Object.keys(materialPriceOverrides).length > 0 && (
                <button
                  onClick={() => setMaterialPriceOverrides({})}
                  style={{ fontSize: 11, color: C.gray300, backgroundColor: 'transparent', border: `1px solid ${C.gray400}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                >
                  Reset to Defaults
                </button>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: C.gray50 }}>
                    <th style={thStyle}>Item</th>
                    <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>Unit</th>
                    <th style={{ ...thStyle, textAlign: 'right', width: 100 }}>Default</th>
                    <th style={{ ...thStyle, textAlign: 'right', width: 120 }}>Unit Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {[...editableMaterialItems, osbItem, laborItem, ...(warrantyEnabled ? [warrantyItem] : [])].map((item) => {
                    const isOverridden = materialPriceOverrides[item.id] != null && materialPriceOverrides[item.id] !== item.defaultPrice;
                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${C.gray200}`, backgroundColor: isOverridden ? '#FFFDE7' : C.white }}>
                        <td style={tdStyle}>{item.name}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontSize: 11, color: C.gray400 }}>{item.unit}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: C.gray400, fontSize: 12 }}>{fmt(item.defaultPrice)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', padding: '4px 8px' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.currentPrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setMaterialPriceOverrides(prev => ({ ...prev, [item.id]: val }));
                            }}
                            style={{
                              width: 90, padding: '5px 8px', textAlign: 'right',
                              border: `1px solid ${isOverridden ? '#F59E0B' : C.gray300}`,
                              borderRadius: 4, fontSize: 13, boxSizing: 'border-box',
                              backgroundColor: isOverridden ? '#FFFDE7' : C.white,
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>
            {estimateType === 'tile' ? 'Tile' : 'Shingle'} Calculations — Building by Building
          </h3>
          <span style={{ fontSize: 12, color: C.gray500 }}>Market: {marketState}</span>
        </div>

        {buildings.map((bldg, bIdx) => {
          const matRows = estimateType === 'tile'
            ? getTileCalcRows(bldg)
            : getMaterialRows(calculateShingleMaterials(bldg, materials, marketState), marketState);
          const matTotal = matRows.reduce((s, r) => s + r.qty * r.price, 0);

          // Labor calc
          let laborSquares, laborCost;
          if (estimateType === 'tile') {
            const sq = (bldg.totalArea * (1 + (bldg.wastePercent || 15) / 100)) / 100;
            laborSquares = Math.ceil(sq);
            laborCost = sq * 185;
          } else {
            // Labor uses pitched area with NO waste for all states
            laborSquares = Math.ceil((bldg.pitchedArea || bldg.totalArea) / 100);
            laborCost = laborSquares * effLaborPerSq;
          }

          return (
            <div key={bIdx} style={{
              border: `1px solid ${C.gray200}`, borderRadius: 8, overflow: 'hidden',
            }}>
              {/* Building header */}
              <div style={{
                backgroundColor: C.navy, padding: '10px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>
                  Building {bldg.siteplanNum || bIdx + 1}
                </span>
                <span style={{ fontSize: 11, color: C.gray300 }}>
                  {Number(bldg.totalArea || 0).toLocaleString('en-US')} SF · Pitch {bldg.predominantPitch || 'N/A'} · {bldg.wastePercent || 12}% waste
                </span>
              </div>

              {/* Material rows */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: C.gray50 }}>
                    <th style={thStyle}>Material</th>
                    <th style={{ ...thStyle, textAlign: 'center', width: 70 }}>Qty</th>
                    <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>Unit</th>
                    <th style={{ ...thStyle, textAlign: 'right', width: 90 }}>Unit Price</th>
                    <th style={{ ...thStyle, textAlign: 'right', width: 100 }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {matRows.map((r, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.white : C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
                      <td style={tdStyle}>{r.name}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{r.qty}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontSize: 11, color: C.gray400 }}>{r.unit}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.price)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(r.qty * r.price)}</td>
                    </tr>
                  ))}
                  {/* Labor rows */}
                  <tr style={{ backgroundColor: C.blueBg, borderTop: `2px solid ${C.gray300}` }}>
                    <td style={tdStyle}>Install Labor ({laborSquares} SQ × {fmt(estimateType === 'tile' ? 185 : effLaborPerSq)}/SQ)</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{laborSquares}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontSize: 11, color: C.gray400 }}>SQ</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(estimateType === 'tile' ? 185 : effLaborPerSq)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(laborCost)}</td>
                  </tr>
                  {estimateType !== 'tile' && warrantyEnabled && (
                    <tr style={{ backgroundColor: C.blueBg }}>
                      <td style={tdStyle}>Warranty ({laborSquares} SQ × {fmt(effWarrantyPerSq)}/SQ)</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{laborSquares}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontSize: 11, color: C.gray400 }}>SQ</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(effWarrantyPerSq)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(laborSquares * effWarrantyPerSq)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Building subtotal */}
              {(() => {
                const warranty = (estimateType !== 'tile' && warrantyEnabled) ? laborSquares * effWarrantyPerSq : 0;
                const bldgSubtotal = matTotal + laborCost + warranty + matTotal * (jobTaxPercent / 100);
                return (
                  <div style={{
                    backgroundColor: C.gray100, padding: '8px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 12, color: C.gray600 }}>
                      Material: {fmt(matTotal)} · Labor: {fmt(laborCost)}{warrantyEnabled ? ` · Warranty: ${fmt(warranty)}` : ''} · Tax ({(jobTaxPercent || 7.5).toFixed(1)}%): {fmt(matTotal * (jobTaxPercent / 100))}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                      Subtotal: {fmt(bldgSubtotal)}
                    </span>
                  </div>
                );
              })()}
            </div>
          );
        })}

        {/* Equipment costs — per-job, manually entered */}
        {estimateType !== 'tile' && (
          <div style={{
            backgroundColor: C.gray100, padding: 16, borderRadius: 8,
            border: `1px solid ${C.gray200}`,
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 12 }}>
              Equipment &amp; Job Costs (enter per job)
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.gray600, display: 'block', marginBottom: 4 }}>Forklift</label>
                <input
                  type="number"
                  min="0"
                  value={jobForkliftCost}
                  onChange={(e) => setJobForkliftCost(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.gray600, display: 'block', marginBottom: 4 }}>Dumpster</label>
                <input
                  type="number"
                  min="0"
                  value={jobDumpsterCost}
                  onChange={(e) => setJobDumpsterCost(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.gray600, display: 'block', marginBottom: 4 }}>Permit</label>
                <input
                  type="number"
                  min="0"
                  value={jobPermitCost}
                  onChange={(e) => setJobPermitCost(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: '1 1 140px', display: 'flex', alignItems: 'flex-end' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>
                  Total: {fmt(jobForkliftCost + jobDumpsterCost + jobPermitCost)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warranty toggle */}
        {estimateType !== 'tile' && (
          <div style={{
            backgroundColor: C.gray100, padding: 16, borderRadius: 8,
            border: `1px solid ${C.gray200}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                onClick={() => setWarrantyEnabled(!warrantyEnabled)}
                style={{
                  width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                  backgroundColor: warrantyEnabled ? '#22C55E' : C.gray300,
                  position: 'relative', transition: 'background-color 0.2s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', backgroundColor: C.white,
                  position: 'absolute', top: 2,
                  left: warrantyEnabled ? 20 : 2,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              Warranty Included
            </label>
            {!warrantyEnabled && (
              <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 500 }}>
                Warranty costs removed from all buildings
              </span>
            )}
          </div>
        )}

        {/* Margin setting */}
        <div style={{
          backgroundColor: C.gray100, padding: 16, borderRadius: 8,
          border: `1px solid ${C.gray200}`,
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 12 }}>
            Margin &amp; Tax
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 160px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.gray600, display: 'block', marginBottom: 4 }}>Margin %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={jobMarginPercent}
                onChange={(e) => setJobMarginPercent(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: '0 0 160px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.gray600, display: 'block', marginBottom: 4 }}>Tax Rate %</label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={jobTaxPercent}
                onChange={(e) => setJobTaxPercent(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: C.gray400 }}>
                Final pricing with margin shown in Pricing tab →
              </span>
            </div>
          </div>
        </div>

        {/* ── Cost Summary Table (matches Pricing page numbers) ── */}
        {buildings.length > 0 && estimateType !== 'tpo' && (() => {
          const costData = estimateType === 'tile' ? getTileCosts() : getShingleCosts();
          const summary = costData.summary;
          // For tile we don't have the full summary breakdown, so only show for shingle
          if (!summary) return null;
          const numBldgs = buildings.length || 1;
          const equipForklift = jobForkliftCost || 0;
          const equipDumpster = jobDumpsterCost || 0;
          const equipPermit = jobPermitCost || 0;
          const totalEquip = equipForklift + equipDumpster + equipPermit;
          const equipPerBldg = totalEquip / numBldgs;
          const marginRate = (jobMarginPercent || 25) / 100;

          return (
            <div style={{ border: `1px solid ${C.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ backgroundColor: C.navy, padding: '10px 16px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>
                  Cost Summary — All Buildings
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                  <thead>
                    <tr style={{ backgroundColor: C.gray50 }}>
                      <th style={thStyle}>Bldg</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Material</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Labor</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Warranty</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Tax</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Equipment</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Margin</th>
                      <th style={{ ...thStyle, textAlign: 'right', fontWeight: 700 }}>Total</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>$/SQ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.buildings.map((b, i) => {
                      const bldgSub = b.materialCost + b.laborCost + b.warrantyCost + b.taxAmount + equipPerBldg;
                      const bldgMargin = bldgSub / (1 - marginRate) - bldgSub;
                      const bldgTotal = bldgSub + bldgMargin;
                      const bldgSquares = Math.ceil((buildings[i]?.pitchedArea || buildings[i]?.totalArea || 1) / 100);
                      const pricePerSq = bldgTotal / bldgSquares;
                      return (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.white : C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
                          <td style={tdStyle}>{buildings[i]?.siteplanNum || i + 1}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(b.materialCost)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(b.laborCost)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(b.warrantyCost)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(b.taxAmount)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(equipPerBldg)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(bldgSub)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: '#E65100' }}>{fmt(bldgMargin)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(bldgTotal)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontSize: 11 }}>{fmt(pricePerSq)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {/* Totals row */}
                    <tr style={{ backgroundColor: C.gray100, borderTop: `2px solid ${C.gray300}` }}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>Totals</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(summary.totalMaterial)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(summary.totalLabor)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(summary.totalWarranty)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(summary.totalTax)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(totalEquip)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{fmt(summary.grandTotal - summary.totalMargin)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#E65100' }}>{fmt(summary.totalMargin)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{fmt(summary.grandTotal)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontSize: 11 }}>{(() => {
                        const totalSQ = buildings.reduce((s, bl) => s + Math.ceil((bl.pitchedArea || bl.totalArea || 1) / 100), 0);
                        return fmt(summary.grandTotal / totalSQ);
                      })()}</td>
                    </tr>
                    {/* Equipment breakdown */}
                    {totalEquip > 0 && (
                      <tr style={{ backgroundColor: C.gray50 }}>
                        <td colSpan={6} style={{ ...tdStyle, fontSize: 11, color: C.gray500 }}>
                          Equipment: Forklift {fmt(equipForklift)} · Dumpster {fmt(equipDumpster)} · Permit {fmt(equipPermit)}
                        </td>
                        <td colSpan={4} />
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  // ==================== STEP RENDERERS ====================

  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Upload Project Data</h3>

      {/* File Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) { processFile(file); } }}
        style={{
          border: `2px dashed ${dragging ? C.blue : C.gray300}`,
          borderRadius: 8,
          padding: 32,
          textAlign: 'center',
          backgroundColor: dragging ? '#E3F2FD' : C.gray50,
          cursor: 'pointer',
          transition: 'border-color 0.2s, background-color 0.2s',
        }}
        onMouseOver={(e) => !dragging && (e.currentTarget.style.borderColor = C.blue)}
        onMouseOut={(e) => !dragging && (e.currentTarget.style.borderColor = C.gray300)}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <p style={{ fontSize: 24, marginBottom: 8 }}>
          {estimateType === 'tpo' ? '📊' : '📄'}
        </p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
          {parsing ? 'Parsing...' : 'Click to upload or drag a file here'}
        </p>
        <p style={{ fontSize: 12, color: C.gray500 }}>
          {estimateType === 'tpo'
            ? 'Beam AI takeoff (Excel) or PDF'
            : 'Roof-R PDF report or measurement spreadsheet'}
        </p>
      </div>

      {/* Saved Files */}
      {uploadedFiles.length > 0 && (
        <div style={{
          border: `1px solid ${C.gray200}`, borderRadius: 8,
          padding: 12, backgroundColor: C.white,
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 8 }}>
            Saved Files ({uploadedFiles.length})
          </p>
          {uploadedFiles.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 8px', backgroundColor: C.gray50, borderRadius: 6,
              marginBottom: i < uploadedFiles.length - 1 ? 6 : 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 16 }}>{f.name.endsWith('.pdf') ? '📄' : '📊'}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                  </p>
                  <p style={{ fontSize: 10, color: C.gray500, margin: 0 }}>
                    {f.size ? `${(f.size / 1024).toFixed(0)} KB · ` : ''}{new Date(f.uploadedAt).toLocaleDateString()}
                    {f.downloadURL ? ' · Cloud' : ''}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => handleDownloadFile(f)}
                  title="Download"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.blue, padding: '2px 4px' }}>
                  ⬇️
                </button>
                <button onClick={() => handleRemoveFile(f.name)}
                  title="Remove"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.red, padding: '2px 4px' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadStatus && (
        <div style={{
          padding: 12,
          backgroundColor: uploadStatus.includes('Error') ? C.redBg : C.greenBg,
          borderRadius: 8,
          fontSize: 13,
          color: uploadStatus.includes('Error') ? C.red : C.green,
        }}>
          {uploadStatus}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div data-error={validationErrors.estimateName ? "true" : undefined} style={{
          borderRadius: 8,
          padding: validationErrors.estimateName ? '8px' : '0',
          backgroundColor: validationErrors.estimateName ? '#FFE5E5' : 'transparent',
          border: validationErrors.estimateName ? `2px solid ${C.red}` : 'none',
        }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: 'block', marginBottom: 6 }}>Estimate Name</label>
          <input type="text" value={estimateName} onChange={(e) => setEstimateName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${validationErrors.estimateName ? C.red : C.gray300}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: 'block', marginBottom: 6 }}>Market/State</label>
          <select value={marketState} onChange={(e) => setMarketState(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}>
            <option value="FL">Florida (TPA)</option>
            <option value="GA">Georgia (ATL)</option>
            <option value="TX">Texas (DFW)</option>
            <option value="TN">Tennessee (NSH)</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: 'block', marginBottom: 6 }}>Estimate Type</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ key: 'shingle', label: 'Shingle', icon: '🏠' }, { key: 'tile', label: 'Tile', icon: '🧱' }, { key: 'tpo', label: 'TPO', icon: '🏢' }].map(t => (
            <button key={t.key} onClick={() => setEstimateType(t.key)}
              style={{
                flex: 1, padding: '12px', border: `2px solid ${estimateType === t.key ? C.red : C.gray200}`,
                borderRadius: 8, backgroundColor: estimateType === t.key ? C.redBg : C.white,
                cursor: 'pointer', fontSize: 13, fontWeight: 600, color: estimateType === t.key ? C.red : C.gray600,
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {buildings.length === 0 && tpoMaterials.length === 0 && (
        <button onClick={handleLoadDemo}
          style={{ padding: '10px', backgroundColor: C.blueBg, color: C.blue, border: `1px solid ${C.blue}`,
            borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          Load Demo Data (Willow Bridge)
        </button>
      )}
    </div>
  );

  const renderStep2 = () => {
    if (estimateType === 'tpo') {
      return (
        <div data-error={validationErrors.tpoMaterials ? "true" : undefined} style={{
          display: 'flex', flexDirection: 'column', gap: 20,
          borderRadius: 8,
          padding: validationErrors.tpoMaterials ? '8px' : '0',
          backgroundColor: validationErrors.tpoMaterials ? '#FFE5E5' : 'transparent',
          border: validationErrors.tpoMaterials ? `2px solid ${C.red}` : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Materials ({tpoMaterials.length} items)</h3>
            <button onClick={() => setTpoMaterials([...tpoMaterials, { name: '', quantity: 0, unit: 'EA', unitCost: 0 }])}
              style={{ padding: '6px 12px', backgroundColor: C.blue, color: C.white, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Add Material
            </button>
          </div>
          <DataTable columns={tpoColumns} data={tpoMaterials} onDataChange={setTpoMaterials} searchable={true} />
        </div>
      );
    }

    return (
      <div data-error={validationErrors.buildings ? "true" : undefined} style={{
        display: 'flex', flexDirection: 'column', gap: 20,
        borderRadius: 8,
        padding: validationErrors.buildings ? '8px' : '0',
        backgroundColor: validationErrors.buildings ? '#FFE5E5' : 'transparent',
        border: validationErrors.buildings ? `2px solid ${C.red}` : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Buildings ({buildings.length})</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCopyPreviousBuilding}
              style={{ padding: '6px 12px', backgroundColor: C.blue, color: C.white, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              📋 Copy Previous
            </button>
            <button onClick={handleAddBuilding}
              style={{ padding: '6px 12px', backgroundColor: C.blue, color: C.white, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Add Building
            </button>
          </div>
        </div>
        <DataTable columns={shingleColumns} data={buildings} onDataChange={setBuildings} searchable={false}
          onDeleteRow={handleDeleteBuilding} roundDecimals={2} />
      </div>
    );
  };

  const renderStep3 = () => {
    const warnings = BUILDING_CODE_WARNINGS[marketState] || [];

    // Margin percent — use the job-level override
    const marginPercent = jobMarginPercent || 25;

    if (estimateType === 'tpo') {
      const tpoCosts = getTPOCosts();
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>TPO Pricing</h3>

          {warnings.length > 0 && (
            <div style={{ backgroundColor: C.blueBg, padding: 14, borderRadius: 8, borderLeft: `4px solid ${C.blue}` }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.blue, marginBottom: 6 }}>Building Code Warnings — {marketState}</p>
              {warnings.slice(0, 2).map((w, i) => <p key={i} style={{ fontSize: 12, color: C.blue, marginBottom: 3 }}>• {w}</p>)}
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: C.gray50 }}>
                <th style={thStyle}>Item</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Unit Cost</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {tpoCosts.lineItems.filter(li => li.lineCost > 0).map((li, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.white : C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
                  <td style={tdStyle}>{li.name}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{li.quantity} {li.unit}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(li.unitCost)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(li.lineCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {renderCostSummary(tpoCosts, canViewMargin)}
        </div>
      );
    }

    // Shingle or Tile pricing
    const costData = estimateType === 'tile' ? getTileCosts() : getShingleCosts();
    const stLabor = STATE_LABOR[marketState] || STATE_LABOR.GA;
    const stFin = STATE_FINANCIALS[marketState] || STATE_FINANCIALS.GA;
    const numBldgs = buildings.length || 1;
    const forkliftPer = jobForkliftCost / numBldgs;
    const dumpsterPer = jobDumpsterCost / numBldgs;
    const permitPer = jobPermitCost / numBldgs;

    // Build rows with all columns
    const pricingRows = costData.rows.map(row => {
      const bldgSubtotal = (row.materialCost || 0) + (row.laborCost || 0)
        + (row.warrantyCost || 0) + forkliftPer + dumpsterPer + permitPer + (row.taxAmount || 0);
      const jobMarginDecimal = (jobMarginPercent || 25) / 100;
      const bldgMargin = bldgSubtotal / (1 - jobMarginDecimal) - bldgSubtotal;
      const bldgTotal = bldgSubtotal + bldgMargin;
      return { ...row, forklift: forkliftPer, dumpster: dumpsterPer, permit: permitPer, margin: bldgMargin, bldgTotal };
    });

    // Column totals
    const colTotals = {
      materialCost: pricingRows.reduce((s, r) => s + (r.materialCost || 0), 0),
      laborCost: pricingRows.reduce((s, r) => s + (r.laborCost || 0), 0),
      warrantyCost: pricingRows.reduce((s, r) => s + (r.warrantyCost || 0), 0),
      forklift: pricingRows.reduce((s, r) => s + r.forklift, 0),
      dumpster: pricingRows.reduce((s, r) => s + r.dumpster, 0),
      permit: pricingRows.reduce((s, r) => s + r.permit, 0),
      taxAmount: pricingRows.reduce((s, r) => s + (r.taxAmount || 0), 0),
      margin: pricingRows.reduce((s, r) => s + r.margin, 0),
      bldgTotal: pricingRows.reduce((s, r) => s + r.bldgTotal, 0),
    };

    const ssCellR = { ...tdStyle, textAlign: 'right', padding: '6px 10px', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' };
    const ssHead = { ...thStyle, textAlign: 'right', padding: '8px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.02em' };
    const ssHeadL = { ...ssHead, textAlign: 'left' };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Low margin warning */}
        {canViewMargin && marginPercent < 25 && (
          <div style={{ padding: '10px 16px', background: '#FEE2E2', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span style={{ fontSize: 14, color: '#DC2626', fontWeight: 600 }}>
              Low margin alert: {marginPercent.toFixed(1)}% (minimum recommended: 25%)
            </span>
          </div>
        )}

        <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>
          {estimateType === 'tile' ? 'Tile' : 'Shingle'} Pricing
        </h3>

        {/* Multi-option pricing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#252842' }}>Multi-Option Pricing</label>
          <button
            type="button"
            onClick={() => setTiersEnabled(!tiersEnabled)}
            className="pressable"
            style={{
              padding: '4px 12px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: tiersEnabled ? '#252842' : '#F5F5F7',
              color: tiersEnabled ? '#fff' : '#6B7280',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {tiersEnabled ? 'Enabled' : 'Off'}
          </button>
        </div>

        {/* Tier tabs when enabled */}
        {tiersEnabled && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: `2px solid #E2E8F0`, paddingBottom: 8 }}>
            {['good', 'better', 'best'].map(tier => (
              <button
                key={tier}
                onClick={() => setActiveTier(tier)}
                style={{
                  padding: '8px 16px',
                  border: activeTier === tier ? `2px solid #252842` : `1px solid #E2E8F0`,
                  background: activeTier === tier ? '#252842' : '#F5F5F7',
                  color: activeTier === tier ? '#fff' : '#475569',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: activeTier === tier ? 600 : 500,
                  fontSize: 13,
                }}
              >
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div style={{ backgroundColor: C.blueBg, padding: 14, borderRadius: 8, borderLeft: `4px solid ${C.blue}` }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.blue, marginBottom: 6 }}>Building Code Warnings — {marketState}</p>
            {warnings.slice(0, 3).map((w, i) => <p key={i} style={{ fontSize: 12, color: C.blue, marginBottom: 3 }}>• {w}</p>)}
          </div>
        )}

        <div style={{ overflowX: 'auto', border: `1px solid ${C.gray300}`, borderRadius: 6, backgroundColor: C.white }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr style={{ backgroundColor: C.navy }}>
                <th style={{ ...ssHeadL, color: C.white, borderRight: `1px solid ${C.navyLight}` }}>Building</th>
                <th style={{ ...ssHead, color: C.white, borderRight: `1px solid ${C.navyLight}` }}>Material</th>
                <th style={{ ...ssHead, color: C.white, borderRight: `1px solid ${C.navyLight}` }}>Install</th>
                <th style={{ ...ssHead, color: C.white, borderRight: `1px solid ${C.navyLight}` }}>Warranty</th>
                <th style={{ ...ssHead, color: C.white, borderRight: `1px solid ${C.navyLight}` }}>Forklift</th>
                <th style={{ ...ssHead, color: C.white, borderRight: `1px solid ${C.navyLight}` }}>Dumpster</th>
                <th style={{ ...ssHead, color: C.white, borderRight: `1px solid ${C.navyLight}` }}>Permit</th>
                <th style={{ ...ssHead, color: C.white, borderRight: `1px solid ${C.navyLight}` }}>Tax ({(jobTaxPercent || 7.5).toFixed(1)}%)</th>
                {canViewMargin && (
                  <th style={{ ...ssHead, color: C.white, borderRight: `1px solid ${C.navyLight}` }}>Margin ({(jobMarginPercent || 25).toFixed(0)}%)</th>
                )}
                <th style={{ ...ssHead, color: C.white }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {pricingRows.map((row, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.white : C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
                  <td style={{ ...tdStyle, padding: '6px 10px', fontSize: 12, fontWeight: 500, borderRight: `1px solid ${C.gray200}` }}>Bldg {row.building}</td>
                  <td style={{ ...ssCellR, borderRight: `1px solid ${C.gray200}` }}>{fmt(row.materialCost)}</td>
                  <td style={{ ...ssCellR, borderRight: `1px solid ${C.gray200}` }}>{fmt(row.laborCost)}</td>
                  <td style={{ ...ssCellR, borderRight: `1px solid ${C.gray200}` }}>{fmt(row.warrantyCost || 0)}</td>
                  <td style={{ ...ssCellR, borderRight: `1px solid ${C.gray200}` }}>{fmt(row.forklift)}</td>
                  <td style={{ ...ssCellR, borderRight: `1px solid ${C.gray200}` }}>{fmt(row.dumpster)}</td>
                  <td style={{ ...ssCellR, borderRight: `1px solid ${C.gray200}` }}>{fmt(row.permit)}</td>
                  <td style={{ ...ssCellR, borderRight: `1px solid ${C.gray200}` }}>{fmt(row.taxAmount || 0)}</td>
                  {canViewMargin && (
                    <td style={{ ...ssCellR, borderRight: `1px solid ${C.gray200}` }}>{fmt(row.margin)}</td>
                  )}
                  <td style={{ ...ssCellR, fontWeight: 700, color: C.navy }}>{fmt(row.bldgTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: C.navy, borderTop: `2px solid ${C.navyDark}` }}>
                <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 700, color: C.white }}>TOTALS</td>
                <td style={{ ...ssCellR, fontWeight: 700, color: C.white }}>{fmt(colTotals.materialCost)}</td>
                <td style={{ ...ssCellR, fontWeight: 700, color: C.white }}>{fmt(colTotals.laborCost)}</td>
                <td style={{ ...ssCellR, fontWeight: 700, color: C.white }}>{fmt(colTotals.warrantyCost)}</td>
                <td style={{ ...ssCellR, fontWeight: 700, color: C.white }}>{fmt(colTotals.forklift)}</td>
                <td style={{ ...ssCellR, fontWeight: 700, color: C.white }}>{fmt(colTotals.dumpster)}</td>
                <td style={{ ...ssCellR, fontWeight: 700, color: C.white }}>{fmt(colTotals.permit)}</td>
                <td style={{ ...ssCellR, fontWeight: 700, color: C.white }}>{fmt(colTotals.taxAmount)}</td>
                {canViewMargin && (
                  <td style={{ ...ssCellR, fontWeight: 700, color: C.white }}>{fmt(colTotals.margin)}</td>
                )}
                <td style={{ ...ssCellR, fontWeight: 700, color: C.red, fontSize: 13 }}>{fmt(colTotals.bldgTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Custom Line Items */}
        <div style={{ marginTop: 24, padding: 16, border: '1px solid #E2E8F0', borderRadius: 12 }}>
          <CustomLineItems
            items={estimate?.customLineItems || []}
            onChange={(items) => updateEstimate({ customLineItems: items })}
            readOnly={false}
          />
        </div>

        {/* Comment Thread */}
        <div style={{ marginTop: 24 }}>
          <CommentThread
            comments={estimate?.comments || []}
            currentUser={currentUser}
            onAddComment={async (comment) => {
              const updated = [...(estimate?.comments || []), comment];
              updateEstimate({ comments: updated });
            }}
          />
        </div>

        {/* Revision History */}
        <div style={{ marginTop: 24 }}>
          <RevisionHistory revisions={estimate?.revisions || []} />
        </div>

        {/* Audit Trail */}
        <div style={{ marginTop: 24 }}>
          <AuditTrail entries={estimate?.auditTrail || []} />
        </div>

        <div style={{
          backgroundColor: C.gray100, padding: 16, borderRadius: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Total Project Cost:</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.red }}>{fmtInt(colTotals.bldgTotal)}</span>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const totalCost = getTotalCost();
    const scopeItems = estimateType === 'tpo' ? SCOPE_ITEMS_TPO : estimateType === 'tile' ? SCOPE_ITEMS_TILE : SCOPE_ITEMS_SHINGLE;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Proposal Preview</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setProposalMode('total')}
              style={{ padding: '6px 12px', backgroundColor: proposalMode === 'total' ? C.navy : C.gray200,
                color: proposalMode === 'total' ? C.white : C.gray600, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Total Only
            </button>
            <button onClick={() => setProposalMode('itemized')}
              style={{ padding: '6px 12px', backgroundColor: proposalMode === 'itemized' ? C.navy : C.gray200,
                color: proposalMode === 'itemized' ? C.white : C.gray600, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Itemized
            </button>
          </div>
        </div>

        <div style={{
          backgroundColor: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8,
          padding: 28, fontSize: 13, lineHeight: 1.7, color: C.gray700,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${C.red}` }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: 0 }}>Colony Roofers</h2>
              <p style={{ fontSize: 11, color: C.gray500, margin: '2px 0' }}>{COMPANY_INFO.phone} | {COMPANY_INFO.email}</p>
              <p style={{ fontSize: 11, color: C.gray500, margin: '2px 0 0' }}>{COMPANY_INFO.website}</p>
              <p style={{ fontSize: 12, color: C.gray500, margin: '4px 0 0' }}>Commercial Roofing Proposal</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: C.gray500, margin: 0 }}>Date: {new Date().toLocaleDateString()}</p>
              <p style={{ fontSize: 12, color: C.gray500, margin: '2px 0 0' }}>Estimate #: {estimate?.id?.slice(0, 6).toUpperCase() || 'DRAFT'}</p>
            </div>
          </div>

          {/* Property Info */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 6 }}>Property</h4>
            <p style={{ margin: 0 }}>{estimateName}</p>
            {estimate?.address && <p style={{ margin: '2px 0', color: C.gray500 }}>{estimate.address}, {estimate.city} {marketState} {estimate.zip}</p>}
          </div>

          {/* Scope of Work */}
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Scope of Work</h4>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            {scopeItems.map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>

          {/* Pricing */}
          {proposalMode === 'itemized' && estimateType !== 'tpo' && (() => {
            const costData = estimateType === 'tile' ? getTileCosts() : getShingleCosts();
            const summary = costData.summary;
            const numBldgs = buildings.length || 1;
            const totalEquip = (jobForkliftCost || 0) + (jobDumpsterCost || 0) + (jobPermitCost || 0);
            const equipPerBldg = totalEquip / numBldgs;
            const marginRate = (jobMarginPercent || 25) / 100;

            return (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Pricing by Building</h4>
                {(summary ? summary.buildings : costData.rows).map((row, i) => {
                  const bldgSub = row.materialCost + row.laborCost + row.warrantyCost + row.taxAmount + equipPerBldg;
                  const bldgMargin = bldgSub / (1 - marginRate) - bldgSub;
                  const bldgTotal = bldgSub + bldgMargin;
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.gray100}` }}>
                      <span>Building {buildings[i]?.siteplanNum || i + 1}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(bldgTotal)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Project Total</h4>
          <p style={{ fontSize: 20, fontWeight: 700, color: C.red, marginBottom: 20 }}>
            {fmtInt(totalCost)}
          </p>

          {/* Unit Cost Extras */}
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Additional Unit Costs</h4>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            {UNIT_COSTS_TEXT.map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>

          {/* Exclusions */}
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Exclusions</h4>
          <p style={{ marginBottom: 20 }}>{EXCLUSIONS}</p>

          {/* Terms */}
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Terms & Conditions</h4>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            {CONTRACT_TERMS.map((term, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{term}</li>
            ))}
          </ul>

          {/* Acceptance */}
          <div style={{ marginTop: 30, paddingTop: 20, borderTop: `2px solid ${C.gray200}` }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Acceptance</h4>
            <p style={{ marginBottom: 16 }}>By signing below, the authorized representative agrees to the scope of work and terms described above.</p>
            <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ borderBottom: '1px solid #000', height: 30, marginBottom: 4 }}></div>
                <p style={{ fontSize: 10 }}>Authorized Signature</p>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ borderBottom: '1px solid #000', height: 30, marginBottom: 4 }}></div>
                <p style={{ fontSize: 10 }}>Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleExportPDF}
            style={{ flex: 1, padding: '12px', backgroundColor: C.blue, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Export as PDF
          </button>
          <button onClick={handleSave}
            style={{ flex: 1, padding: '12px', backgroundColor: C.green, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Save Estimate
          </button>
        </div>
      </div>
    );
  };

  const handleExportPDF = async () => {
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let page = pdfDoc.addPage([612, 792]);
      let y = 740;
      let pageNum = 1;
      const lm = 50;
      const navy = rgb(0.106, 0.165, 0.290);
      const red = rgb(0.902, 0.224, 0.275);
      const gray = rgb(0.4, 0.4, 0.4);
      const lightGray = rgb(0.6, 0.6, 0.6);

      const scopeItems = estimateType === 'tpo' ? SCOPE_ITEMS_TPO : estimateType === 'tile' ? SCOPE_ITEMS_TILE : SCOPE_ITEMS_SHINGLE;

      const addText = (text, x, size, fontType, color) => {
        if (y < 80) {
          // Add page number to current page
          page.drawText(`Page ${pageNum}`, { x: 512, y: 20, size: 9, font, color: lightGray });
          pageNum += 1;
          page = pdfDoc.addPage([612, 792]);
          y = 740;
        }
        page.drawText(text, { x, y, size, font: fontType || font, color: color || gray });
      };

      // Header
      addText('Colony Roofers', lm, 22, boldFont, navy);
      y -= 20;
      addText(COMPANY_INFO.phone + ' | ' + COMPANY_INFO.email, lm, 10, font, gray);
      y -= 12;
      addText(COMPANY_INFO.website, lm, 10, font, gray);
      y -= 14;
      addText('Commercial Roofing Proposal', lm, 11, font, gray);
      y -= 14;
      addText(`Date: ${new Date().toLocaleDateString()}`, lm, 10, font, gray);
      y -= 12;
      addText(`Estimate #: ${estimate?.id?.slice(0, 6).toUpperCase() || 'DRAFT'}`, lm, 10, font, gray);
      y -= 30;

      // Red line
      page.drawLine({ start: { x: lm, y }, end: { x: 562, y }, thickness: 2, color: red });
      y -= 25;

      // Property
      addText('Property:', lm, 12, boldFont, navy);
      y -= 16;
      addText(estimateName, lm, 11, font, gray);
      y -= 14;
      if (estimate?.address) {
        addText(`${estimate.address}, ${estimate.city || ''} ${marketState} ${estimate.zip || ''}`, lm, 10, font, gray);
        y -= 20;
      }
      y -= 10;

      // Scope
      addText('Scope of Work:', lm, 12, boldFont, navy);
      y -= 16;
      scopeItems.forEach(item => {
        const lines = wrapText(item, font, 10, 500);
        lines.forEach(line => {
          addText(`  •  ${line}`, lm, 10, font, gray);
          y -= 14;
        });
        y -= 2;
      });
      y -= 10;

      // Pricing by Building (for itemized mode with shingle/tile)
      if (proposalMode === 'itemized' && estimateType !== 'tpo') {
        addText('Pricing by Building:', lm, 12, boldFont, navy);
        y -= 16;
        const costs = estimateType === 'tile' ? getTileCosts() : getShingleCosts();
        const pdfSummary = costs.summary;
        const pdfNumBldgs = buildings.length || 1;
        const pdfTotalEquip = (jobForkliftCost || 0) + (jobDumpsterCost || 0) + (jobPermitCost || 0);
        const pdfEquipPerBldg = pdfTotalEquip / pdfNumBldgs;
        const pdfMarginRate = (jobMarginPercent || 25) / 100;
        (pdfSummary ? pdfSummary.buildings : costs.rows).forEach((row, i) => {
          const sub = row.materialCost + row.laborCost + row.warrantyCost + row.taxAmount + pdfEquipPerBldg;
          const mrg = sub / (1 - pdfMarginRate) - sub;
          const bTotal = sub + mrg;
          addText(`Building ${buildings[i]?.siteplanNum || i + 1}: ${fmt(bTotal)}`, lm, 10, font, gray);
          y -= 14;
        });
        y -= 10;
      }

      // Total
      addText('Project Total:', lm, 12, boldFont, navy);
      y -= 20;
      addText(fmtInt(getTotalCost()), lm, 18, boldFont, red);
      y -= 30;

      // Unit Costs
      addText('Additional Unit Costs:', lm, 12, boldFont, navy);
      y -= 16;
      UNIT_COSTS_TEXT.forEach(item => {
        const lines = wrapText(item, font, 10, 500);
        lines.forEach(line => {
          addText(`  •  ${line}`, lm, 10, font, gray);
          y -= 14;
        });
        y -= 2;
      });
      y -= 10;

      // Exclusions
      addText('Exclusions:', lm, 12, boldFont, navy);
      y -= 16;
      const exclusionLines = wrapText(EXCLUSIONS, font, 10, 500);
      exclusionLines.forEach(line => {
        addText(line, lm, 10, font, gray);
        y -= 14;
      });
      y -= 10;

      // Terms
      addText('Terms & Conditions:', lm, 12, boldFont, navy);
      y -= 16;
      CONTRACT_TERMS.forEach(term => {
        const lines = wrapText(term, font, 10, 500);
        lines.forEach(line => {
          addText(`  •  ${line}`, lm, 10, font, gray);
          y -= 14;
        });
        y -= 2;
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${estimateName || 'Proposal'}_Colony_Roofers.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Error generating PDF: ' + err.message);
    }
  };

  // ==================== RENDER ====================

  const steps = ['Upload', 'Measurements', 'Calculations', 'Pricing', 'Proposal'];

  // Show success screen after submission
  if (showSuccess) {
    return (
      <SuccessScreen
        title="Estimate Submitted for Review"
        subtitle={estimate?.propertyName || estimate?.address || 'New Estimate'}
        timestamp={new Date().toISOString()}
        referenceId={estimate?.id || estimateId}
        onStartNew={() => {
          setShowSuccess(false);
          onClose?.();
        }}
        startNewLabel="Back to Dashboard"
      />
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: C.white }}>
      {/* Header — sticky so tabs stay visible when scrolling */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.gray200}`, position: 'sticky', top: 0, backgroundColor: C.white, zIndex: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>
            {estimateName || 'New Estimate'}
          </h2>
          <button onClick={() => {
              onClose();
            }}
            style={{ padding: '6px 12px', backgroundColor: C.gray200, color: C.gray600, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                height: 4, width: '100%', borderRadius: 2,
                backgroundColor: i + 1 <= step ? C.red : C.gray200,
                cursor: 'pointer', transition: 'background-color 0.2s',
              }} onClick={() => setStep(i + 1)} />
              <span
                onClick={() => setStep(i + 1)}
                style={{ fontSize: 11, color: i + 1 === step ? C.red : C.gray400, fontWeight: i + 1 === step ? 600 : 400, cursor: 'pointer' }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24 }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderCalculations()}
        {step === 4 && renderStep3()}
        {step === 5 && renderStep4()}
      </div>

      {/* Save confirmation banner */}
      {saveConfirmation && (
        <div style={{
          padding: '10px 24px',
          backgroundColor: '#D1FAE5',
          borderTop: `1px solid #10B981`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fadeIn 0.2s ease-in',
        }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>{saveConfirmation}</span>
        </div>
      )}

      {/* Footer Nav */}
      <div style={{
        padding: '12px 24px', borderTop: `1px solid ${C.gray200}`,
        display: 'flex', justifyContent: 'space-between', backgroundColor: C.gray50,
      }}>
        <button onClick={() => {
          if (step === 1) {
            if (hasUnsavedChanges) {
              setConfirmDialog({
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Leave without saving?',
                onConfirm: () => {
                  setConfirmDialog(null);
                  onClose();
                },
                onCancel: () => setConfirmDialog(null),
              });
            } else {
              onClose();
            }
          } else {
            setStep(step - 1);
          }
        }}
          style={{ padding: '10px 20px', backgroundColor: C.gray200, color: C.navy, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: isSubmitting ? C.gray400 : C.navy,
              color: C.white,
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
            }}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          {step < 5 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                backgroundColor: isSubmitting ? C.gray400 : C.red,
                color: C.white,
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}>
              Next
            </button>
          )}
          {step === 5 && (
            <button
              onClick={() => {
                setIsSubmitting(true);
                setTimeout(() => {
                  setShowSuccess(true);
                  addAuditEntry('estimate_submitted', 'Estimate submitted for review');
                }, 500);
              }}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                backgroundColor: isSubmitting ? C.gray400 : '#10B981',
                color: C.white,
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}>
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
}

// Style helpers
const thStyle = { padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#334155', borderBottom: '1px solid #E2E8F0' };
const tdStyle = { padding: '10px 14px', fontSize: 13, color: '#475569' };

const renderCostSummary = (costs, showMargin = true) => (
  <div style={{ backgroundColor: '#F1F5F9', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
        Material: {fmt(costs.materialCost)} | Labor: {fmt(costs.laborCost)} | Tax: {fmt(costs.taxAmount)} {showMargin && `| Margin: ${fmt(costs.margin)}`}
      </div>
    </div>
    <span style={{ fontSize: 22, fontWeight: 700, color: '#E30613' }}>{fmtInt(costs.total)}</span>
  </div>
);

function wrapText(text, font, size, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
