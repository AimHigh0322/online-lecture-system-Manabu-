import React, { useState, useRef } from "react";
import { FileDown } from "lucide-react";
import { AdminLayout } from "../../components/layout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface CertificateData {
  certificateNumber: string;
  name: string;
  gender: string;
  issueDate: string;
  startDate: string;
  endDate: string;
}

export const CertificateGenerator: React.FC = () => {
  const [formData, setFormData] = useState<CertificateData>({
    certificateNumber: "",
    name: "",
    gender: "",
    issueDate: "",
    startDate: "",
    endDate: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof CertificateData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownload = async () => {
    // Validation
    if (
      !formData.certificateNumber ||
      !formData.name ||
      !formData.gender ||
      !formData.issueDate ||
      !formData.startDate ||
      !formData.endDate
    ) {
      alert("すべての項目を入力してください。");
      return;
    }

    setIsGenerating(true);

    try {
      if (!certificateRef.current) {
        throw new Error("Certificate element not found");
      }

      // Hide the form temporarily while capturing
      const originalDisplay = certificateRef.current.style.display;
      certificateRef.current.style.display = "block";

      // Wait for background image to load
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(void 0);
        img.onerror = () => resolve(void 0); // Continue even if image fails
        img.src = "/img/certificate.png";
        // Timeout after 3 seconds
        setTimeout(() => resolve(void 0), 3000);
      });

      // Wait a moment to ensure the element is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Get the exact dimensions of the certificate element (should be 182mm × 257mm)
      const certWidth = certificateRef.current.offsetWidth;
      const certHeight =
        certificateRef.current.scrollHeight ||
        certificateRef.current.offsetHeight;

      // Convert certificate to canvas with high quality
      // Using scale:3 for high resolution (300 DPI equivalent)
      const scale = 3;
      const canvas = await html2canvas(certificateRef.current, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: null, // Transparent to show background image
        width: certWidth,
        height: certHeight,
        windowWidth: certWidth,
        windowHeight: certHeight,
        onclone: (clonedDoc) => {
          // Ensure background images are loaded in cloned document
          const clonedElement = clonedDoc.querySelector(
            ".certificate-container"
          ) as HTMLElement;
          if (clonedElement) {
            clonedElement.style.backgroundImage = "url('/img/certificate.png')";
            clonedElement.style.backgroundSize = "100% 100%";
            clonedElement.style.backgroundPosition = "top left";
            clonedElement.style.backgroundRepeat = "no-repeat";
          }
        },
      });

      // Restore original display
      certificateRef.current.style.display = originalDisplay;

      // Create PDF in B5 size (JIS B5: 182mm × 257mm)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [182, 257], // JIS B5 size
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 182mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 257mm

      // The certificate element is exactly B5 size (182mm × 257mm)
      // The PDF page is also B5 size (182mm × 257mm)
      // So we can directly fill the entire page with the image
      const imgData = canvas.toDataURL("image/png", 1.0);

      // Add image to fill the entire B5 page exactly (no offset, fills completely)
      // This ensures the certificate image fits perfectly within the PDF page
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST"
      );

      // Generate filename
      const filename = `修了証_${formData.name}_${formData.certificateNumber}.pdf`;
      pdf.save(filename);

      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("修了証の生成中にエラーが発生しました。");
      setIsGenerating(false);
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatDateForTable = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-seminormal text-gray-900">修了証生成</h1>
          <p className="text-sm text-gray-600 mt-1">
            修了証の情報を入力してPDFファイルとしてダウンロードできます。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-seminormal text-gray-900 mb-4">
              入力フォーム
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="certificateNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  修了証番号 <span className="text-red-500">*</span>
                </label>
                <input
                  id="certificateNumber"
                  type="text"
                  value={formData.certificateNumber}
                  onChange={(e) =>
                    handleInputChange("certificateNumber", e.target.value)
                  }
                  placeholder="例: 230609"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  受講者名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="例: SI THU HEIN"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  性別 <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  受講開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  受講終了日 <span className="text-red-500">*</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="issueDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  発行日 <span className="text-red-500">*</span>
                </label>
                <input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) =>
                    handleInputChange("issueDate", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 text-base font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors mt-4"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    <span>修了証PDFダウンロード</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Certificate Preview */}
          <div className="bg-gray-100 rounded-lg p-6 overflow-auto max-h-[calc(100vh-200px)]">
            <h2 className="text-lg font-seminormal text-gray-900 mb-4">
              プレビュー
            </h2>
            <div
              className="bg-white p-4 shadow-lg inline-block"
              style={{ width: "182mm" }}
            >
              <div
                ref={certificateRef}
                className="certificate-container"
                style={{
                  width: "182mm",
                  minHeight: "257mm",
                  position: "relative",
                  backgroundColor: "#ffffff",
                  backgroundImage: "url('/img/certificate.png')",
                  backgroundSize: "100% 100%",
                  backgroundPosition: "top left",
                  backgroundRepeat: "no-repeat",
                  fontFamily:
                    "'MS PGothic', 'Hiragino Kaku Gothic ProN', sans-serif",
                }}
              >
                {/* Content Area */}
                <div
                  style={{
                    padding: "30mm",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {/* Certificate Number */}
                  <div
                    style={{
                      padding: "50px 25px 0 0",
                      textAlign: "right",
                      fontSize: "18px",
                      marginBottom: "30px",
                      fontWeight: "normal",
                    }}
                  >
                    第{formData.certificateNumber || "______"}号
                  </div>

                  {/* Title */}
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "42px",
                      fontWeight: "normal",
                      marginBottom: "35px",
                      letterSpacing: "3px",
                    }}
                  >
                    修了証書
                  </div>

                  {/* Information Table */}
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      border: "1px solid #000",
                      marginBottom: "10px",
                      tableLayout: "fixed",
                    }}
                  >
                    <thead>
                      <tr style={{ verticalAlign: "middle" }}>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "12px 8px",
                            backgroundColor: "#f5f5f5",
                            fontSize: "18px",
                            fontWeight: "normal",
                            width: "25%",
                            textAlign: "center",
                            verticalAlign: "middle",
                            height: "100%",
                            display: "table-cell",
                          }}
                        >
                          受講者名
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "12px 8px",
                            backgroundColor: "#f5f5f5",
                            fontSize: "18px",
                            fontWeight: "normal",
                            width: "15%",
                            textAlign: "center",
                            verticalAlign: "middle",
                            height: "100%",
                            display: "table-cell",
                          }}
                        >
                          性別
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "12px 8px",
                            backgroundColor: "#f5f5f5",
                            fontSize: "18px",
                            fontWeight: "normal",
                            width: "25%",
                            textAlign: "center",
                            verticalAlign: "middle",
                            height: "100%",
                            display: "table-cell",
                          }}
                        >
                          {formData.startDate
                            ? formatDateForTable(formData.startDate)
                            : "受講開始日"}
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "12px 8px",
                            backgroundColor: "#f5f5f5",
                            fontSize: "18px",
                            fontWeight: "normal",
                            width: "35%",
                            textAlign: "center",
                            verticalAlign: "middle",
                            height: "100%",
                            display: "table-cell",
                          }}
                        >
                          受講時間数
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ verticalAlign: "middle" }}>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "12px 8px",
                            fontSize: "18px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontWeight: "500",
                            height: "100%",
                            display: "table-cell",
                          }}
                        >
                          {formData.name || "________________"}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "12px 8px",
                            fontSize: "18px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontWeight: "500",
                            height: "100%",
                            display: "table-cell",
                          }}
                        >
                          {formData.gender || "____"}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "12px 8px",
                            fontSize: "18px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontWeight: "500",
                            height: "100%",
                            display: "table-cell",
                          }}
                        >
                          ミャンマー
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "12px 8px",
                            fontSize: "18px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontWeight: "500",
                            height: "100%",
                            display: "table-cell",
                          }}
                        >
                          174時間
                        </td>
                      </tr>
                      <tr style={{ verticalAlign: "middle" }}>
                        <td
                          colSpan={4}
                          style={{
                            border: "1px solid #000",
                            padding: "12px 8px",
                            backgroundColor: "#f5f5f5",
                            fontSize: "18px",
                            fontWeight: "normal",
                            textAlign: "center",
                            verticalAlign: "middle",
                            height: "100%",
                            display: "table-cell",
                          }}
                        >
                          受講期間
                        </td>
                      </tr>
                      <tr style={{ verticalAlign: "middle" }}>
                        <td
                          colSpan={4}
                          style={{
                            border: "1px solid #000",
                            padding: "12px 8px",
                            fontSize: "18px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            height: "100%",
                            display: "table-cell",
                          }}
                        >
                          {formData.startDate && formData.endDate
                            ? `${formatDateForDisplay(
                                formData.startDate
                              )} - ${formatDateForDisplay(formData.endDate)}`
                            : "________________"}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Certificate Statement */}
                  <div
                    style={{
                      fontSize: "20px",
                      lineHeight: "2.2",
                      textAlign: "left",
                      marginTop: "10px",
                      marginBottom: "40px",
                      fontWeight: "normal",
                    }}
                  >
                    <div>上記の者は本校で規定の講習を</div>
                    <div>修了したことを証する</div>
                  </div>

                  {/* Issuing Information */}
                  <div
                    style={{
                      textAlign: "right",
                      marginTop: "0",
                      marginRight: "0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        marginBottom: "8px",
                        fontWeight: "500",
                      }}
                    >
                      {formData.issueDate
                        ? formatDateForDisplay(formData.issueDate)
                        : "発行日"}
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "normal",
                        marginBottom: "6px",
                      }}
                    >
                      学ぼう国際研修センター
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        paddingRight: "70px",
                        fontSize: "16px",
                        marginBottom: "10px",
                        fontWeight: "normal",
                      }}
                    >
                      学院長&nbsp;&nbsp;中野&nbsp;&nbsp;学
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CertificateGenerator;
