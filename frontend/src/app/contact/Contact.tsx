import React, { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    enquiry: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    // You can add API call here
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Image */}
      <div className="relative w-full h-64 md:h-96 overflow-hidden">
        <img
          src="/img/contact.png"
          alt="Contact"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white uppercase">
            Contact Us
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Contact Form */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              お問い合わせフォーム
            </h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="お名前を入力してください"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="メールアドレスを入力してください"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label
                  htmlFor="enquiry"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  お問い合わせ内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="enquiry"
                  name="enquiry"
                  value={formData.enquiry}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="お問い合わせ内容を入力してください"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none text-gray-800 placeholder-gray-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-4 px-8 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg uppercase tracking-wide"
              >
                送信する
              </button>
            </form>
          </div>

          {/* Right Column - Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                連絡先情報
              </h2>
            </div>

            {/* Phone Contact */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">お電話</h3>
                <p className="text-xl font-semibold text-gray-700">
                  +81 (0)3 1234 5678
                </p>
              </div>
            </div>

            {/* Email Contact */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  メールアドレス
                </h3>
                <p className="text-xl font-semibold text-gray-700">
                  info@manabou-center.com
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">所在地</h3>
                <p className="text-gray-700 leading-relaxed">
                  学ぼう国際研修センター
                  <br />
                  〒150-0001 東京都渋谷区神宮前
                  <br />
                  1-1-1 学ぼうビル 3階
                  <br />
                  Tokyo, Japan
                </p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4">営業時間</h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex justify-between">
                  <span>月曜日 - 金曜日</span>
                  <span className="font-semibold">9:00 - 18:00</span>
                </p>
                <p className="flex justify-between">
                  <span>土曜日</span>
                  <span className="font-semibold">9:00 - 17:00</span>
                </p>
                <p className="flex justify-between">
                  <span>日曜日・祝日</span>
                  <span className="font-semibold">休業</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
