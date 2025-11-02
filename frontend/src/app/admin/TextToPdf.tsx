import React, { useState } from "react";
import { FileDown } from "lucide-react";
import { AdminLayout } from "../../components/layout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const TextToPdf: React.FC = () => {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!text.trim()) {
      alert("テキストを入力してください。");
      return;
    }

    setIsGenerating(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxContentWidth = pdfWidth - margin * 2;
      const maxContentHeight = pdfHeight - margin * 2;

      // Create a temporary container for rendering text
      // Convert mm to px (assuming 96 DPI: 1mm ≈ 3.7795px)
      const mmToPx = 3.7795;
      const contentWidthPx = maxContentWidth * mmToPx;

      const createTempDiv = (content: string) => {
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = "-9999px";
        div.style.top = "0";
        div.style.width = `${contentWidthPx}px`;
        div.style.padding = "0";
        div.style.fontSize = "14px";
        div.style.fontFamily = "sans-serif, 'Meiryo', 'MS PGothic', 'MS Gothic', 'Hiragino Kaku Gothic ProN'";
        div.style.lineHeight = "1.6";
        div.style.color = "#000";
        div.style.whiteSpace = "pre-wrap";
        div.style.wordWrap = "break-word";
        div.style.boxSizing = "border-box";
        div.textContent = content;
        return div;
      };

      // Function to get approximate height without rendering canvas
      const getTextHeight = (content: string): number => {
        const tempDiv = createTempDiv(content);
        document.body.appendChild(tempDiv);
        const height = tempDiv.scrollHeight / mmToPx; // Convert px to mm
        document.body.removeChild(tempDiv);
        return height;
      };

      // Function to render a page from text content
      const renderPage = async (pageText: string): Promise<{ imgData: string; height: number }> => {
        const tempDiv = createTempDiv(pageText);
        document.body.appendChild(tempDiv);

        // Wait a moment for browser to render
        await new Promise(resolve => setTimeout(resolve, 50));

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL("image/png");
        const heightInMm = canvas.height / (2 * mmToPx); // Account for scale factor

        return { imgData, height: heightInMm };
      };

      // Split text into pages based on estimated height
      const lines = text.split("\n");
      const pages: string[] = [];
      let currentPage = "";

      for (const line of lines) {
        const testPage = currentPage ? `${currentPage}\n${line}` : line;
        const testHeight = getTextHeight(testPage);

        if (testHeight > maxContentHeight && currentPage) {
          pages.push(currentPage);
          currentPage = line;
        } else {
          currentPage = testPage;
        }
      }

      if (currentPage) {
        pages.push(currentPage);
      }

      // Render each page
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const { imgData, height } = await renderPage(pages[i]);
        const imgWidth = maxContentWidth;
        const imgHeight = Math.min(height, maxContentHeight);

        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `document-${timestamp}.pdf`;

      // Save the PDF
      pdf.save(filename);

      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDFの生成中にエラーが発生しました。");
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setText("");
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">テキストPDF生成</h1>
          <p className="text-sm text-gray-600 mt-1">
            日本語テキストを入力してPDFファイルとしてダウンロードできます。
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {/* Text Input Area */}
            <div>
              <label
                htmlFor="text-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                テキスト入力
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ここに日本語テキストを入力してください..."
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-base"
                style={{ fontFamily: "sans-serif" }}
              />
              <div className="mt-2 text-xs text-gray-500">
                文字数: {text.length} 文字
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleClear}
                disabled={!text.trim() || isGenerating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                クリア
              </button>
              <button
                onClick={handleDownload}
                disabled={!text.trim() || isGenerating}
                className="flex items-center space-x-2 px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>PDFダウンロード</span>
                  </>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                使用方法
              </h3>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>上記のテキストエリアに日本語テキストを入力してください。</li>
                <li>「PDFダウンロード」ボタンをクリックすると、PDFファイルが生成されます。</li>
                <li>複数ページにわたる長いテキストも自動的に分割されます。</li>
                <li>生成されたPDFファイルは自動的にダウンロードされます。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TextToPdf;

