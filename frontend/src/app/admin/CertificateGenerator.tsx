import React, { useState, useRef, useEffect } from "react";
import { FileDown, Upload, X } from "lucide-react";
import { AdminLayout } from "../../components/layout";
import jsPDF from "jspdf";

export const CertificateGenerator: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [certificateNumber, setCertificateNumber] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [trainingHours, setTrainingHours] = useState("");
  const [trainingPeriodStart, setTrainingPeriodStart] = useState("");
  const [trainingPeriodEnd, setTrainingPeriodEnd] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // B5 dimensions in mm: 182mm x 257mm
  const B5_WIDTH_MM = 182;
  const B5_HEIGHT_MM = 257;
  const MARGIN_MM = 40; // 4cm = 40mm
  const CONTENT_WIDTH_MM = B5_WIDTH_MM - MARGIN_MM * 2;

  // Convert mm to px (assuming 96 DPI: 1mm ≈ 3.7795px)
  const mmToPx = 3.7795;
  const canvasWidthPx = B5_WIDTH_MM * mmToPx;
  const canvasHeightPx = B5_HEIGHT_MM * mmToPx;

  useEffect(() => {
    if (uploadedImage && canvasRef.current) {
      drawCertificate().catch(console.error);
    }
  }, [
    uploadedImage,
    certificateNumber,
    participantName,
    gender,
    country,
    trainingHours,
    trainingPeriodStart,
    trainingPeriodEnd,
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCertificate = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasWidthPx;
    canvas.height = canvasHeightPx;

    // Fill white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw the uploaded image
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Calculate aspect ratio to maintain image proportions
        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let drawX = 0;
        let drawY = 0;

        // Scale image to cover canvas while maintaining aspect ratio
        if (imgAspect > canvasAspect) {
          // Image is wider - fit to height
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
        } else {
          // Image is taller - fit to width
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspect;
          drawY = (canvas.height - drawHeight) / 2;
        }

        // Draw the image to cover the entire canvas
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        // Draw text content on top of the image
        drawTextContent(ctx);
        
        imageRef.current = img;
        resolve();
      };
      img.onerror = () => {
        console.error("Failed to load image");
        resolve();
      };
      img.src = uploadedImage;
    });
  };

  const drawTextContent = (ctx: CanvasRenderingContext2D) => {
    if (!ctx) return;

    // Set text properties
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";

    // Calculate content area (within 4cm margin)
    const contentX = MARGIN_MM * mmToPx;
    const contentY = MARGIN_MM * mmToPx;
    const contentWidth = CONTENT_WIDTH_MM * mmToPx;

    // Certificate number (top right)
    if (certificateNumber) {
      ctx.font = "16px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(
        `第${certificateNumber}号`,
        contentX + contentWidth,
        contentY + 20
      );
    }

    // Main title "修了証書"
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "修了証書",
      contentX + contentWidth / 2,
      contentY + 40
    );

    // Table area
    const tableY = contentY + 100;
    const tableRowHeight = 40;
    const tableColWidth = contentWidth / 4;

    // Draw table borders
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;

    // Table header row
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("受講者名", contentX + 10, tableY + 10);
    ctx.fillText("性別", contentX + tableColWidth + 10, tableY + 10);
    ctx.fillText("2023/6/8", contentX + tableColWidth * 2 + 10, tableY + 10);
    ctx.fillText("受講時間数", contentX + tableColWidth * 3 + 10, tableY + 10);

    // Draw horizontal line after header
    ctx.beginPath();
    ctx.moveTo(contentX, tableY + tableRowHeight);
    ctx.lineTo(contentX + contentWidth, tableY + tableRowHeight);
    ctx.stroke();

    // Table data row
    const dataY = tableY + tableRowHeight;
    ctx.fillText(participantName || "", contentX + 10, dataY + 10);
    ctx.fillText(gender || "", contentX + tableColWidth + 10, dataY + 10);
    ctx.fillText(country || "", contentX + tableColWidth * 2 + 10, dataY + 10);
    ctx.textAlign = "right";
    ctx.fillText(
      trainingHours ? `${trainingHours}時間` : "",
      contentX + tableColWidth * 4 - 10,
      dataY + 10
    );
    ctx.textAlign = "left";

    // Draw horizontal line after data row
    ctx.beginPath();
    ctx.moveTo(contentX, dataY + tableRowHeight);
    ctx.lineTo(contentX + contentWidth, dataY + tableRowHeight);
    ctx.stroke();

    // Training period header (merged cell)
    const periodHeaderY = dataY + tableRowHeight;
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "受講期間",
      contentX + contentWidth / 2,
      periodHeaderY + 10
    );

    // Draw horizontal line after period header
    ctx.beginPath();
    ctx.moveTo(contentX, periodHeaderY + tableRowHeight);
    ctx.lineTo(contentX + contentWidth, periodHeaderY + tableRowHeight);
    ctx.stroke();

    // Training period data (merged cell)
    const periodDataY = periodHeaderY + tableRowHeight;
    const periodText = trainingPeriodStart && trainingPeriodEnd
      ? `${trainingPeriodStart}~${trainingPeriodEnd}`
      : "";
    ctx.fillText(periodText, contentX + contentWidth / 2, periodDataY + 10);

    // Draw table outer border
    ctx.strokeRect(contentX, tableY, contentWidth, periodDataY + tableRowHeight - tableY);

    // Concluding statement
    const statementY = periodDataY + tableRowHeight + 30;
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(
      "上記の者は本校で規定の講習を修了したことを証する",
      contentX,
      statementY
    );
  };

  const handleDownloadPDF = async () => {
    if (!uploadedImage) {
      alert("画像をアップロードしてください。");
      return;
    }

    setIsGenerating(true);

    try {
      // Wait for image to load if needed
      if (imageRef.current && !imageRef.current.complete) {
        await new Promise((resolve) => {
          if (imageRef.current) {
            imageRef.current.onload = resolve;
          }
        });
      }

      // Ensure canvas is drawn
      if (canvasRef.current) {
        await drawCertificate();
        // Wait a bit more to ensure rendering is complete
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Create PDF with B5 format
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [B5_WIDTH_MM, B5_HEIGHT_MM],
      });

      // Convert canvas to image using html2canvas for better quality
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        
        // Use html2canvas to capture the canvas with high quality
        const canvasDataUrl = canvas.toDataURL("image/png", 1.0);

        // Add image to PDF covering the full B5 page
        // The canvas already includes the 4cm margin in its design
        pdf.addImage(
          canvasDataUrl,
          "PNG",
          0,
          0,
          B5_WIDTH_MM,
          B5_HEIGHT_MM,
          undefined,
          "FAST"
        );
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `certificate-${timestamp}.pdf`;

      // Save the PDF
      pdf.save(filename);

      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDFの生成中にエラーが発生しました。");
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">修了証生成</h1>
          <p className="text-sm text-gray-600 mt-1">
            修了証の画像をアップロードし、情報を入力してPDFとしてダウンロードできます。
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  修了証画像
                </label>
                {!uploadedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        画像をアップロード
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Certificate template"
                      className="w-full h-auto border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    証書番号
                  </label>
                  <input
                    type="text"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    placeholder="例: 230609"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    受講者名
                  </label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="例: SI THU HEIN"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性別
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    国名
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="例: ミャンマー"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    受講時間数
                  </label>
                  <input
                    type="text"
                    value={trainingHours}
                    onChange={(e) => setTrainingHours(e.target.value)}
                    placeholder="例: 174"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      受講期間（開始）
                    </label>
                    <input
                      type="text"
                      value={trainingPeriodStart}
                      onChange={(e) => setTrainingPeriodStart(e.target.value)}
                      placeholder="例: 2023年6月8日"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      受講期間（終了）
                    </label>
                    <input
                      type="text"
                      value={trainingPeriodEnd}
                      onChange={(e) => setTrainingPeriodEnd(e.target.value)}
                      placeholder="例: 2023年7月7日"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleDownloadPDF}
                  disabled={!uploadedImage || isGenerating}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>PDF生成中...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>PDFダウンロード</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プレビュー
              </label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 overflow-auto">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto border border-gray-200 bg-white"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              使用方法
            </h3>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>修了証の画像をアップロードしてください。</li>
              <li>必要な情報を入力してください。</li>
              <li>右側のプレビューで確認できます。</li>
              <li>「PDFダウンロード」ボタンをクリックすると、B5サイズのPDFファイルが生成されます。</li>
              <li>余白は4センチメートル（40mm）です。</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CertificateGenerator;

