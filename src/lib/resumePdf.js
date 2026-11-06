import { jsPDF } from "jspdf";
import { buildResumePdf } from "../../base44/shared/resumePdfCore.js";
export function generateResumePdf(resume){return buildResumePdf(jsPDF,resume);}
