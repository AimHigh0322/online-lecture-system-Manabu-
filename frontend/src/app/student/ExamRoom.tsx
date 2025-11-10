import React from "react";
import {
  Play,
  Users,
  Award,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ExamRoom: React.FC = () => {
  const navigate = useNavigate();

  const handleStartTest = () => {
    // Directly navigate to exam without face verification
    navigate("/exam-taking");
  };

  return (
    <div className="min-h-screen">
      {/* Hero Image Section */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
        <img
          src="/img/exam.jpg"
          alt="試験ルーム"
          className="w-full h-full object-cover"
        />
        <div className="absolute bg-black/20 inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              試験ルーム
            </h1>
            <p className="text-lg md:text-xl max-w-[700px] mx-auto">
              オンライン講習システム試験で、あなたの知識をテストしましょう
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                オンライン学習で、スキルアップ！
              </h2>
              <p className="text-xl text-gray-600 mb-4">多くの学習者が選んだ</p>
              <p className="text-2xl font-semibold text-gray-800 mb-8">
                学ぼう国際研修センター オンライン講習システム
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700">多様な学習コンテンツ</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700">進捗管理システム</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700">安全な学習環境</span>
                </div>
              </div>

              <button
                onClick={handleStartTest}
                className="w-full max-w-md px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 font-semibold text-lg shadow-lg flex items-center justify-center space-x-3"
              >
                <Play className="w-6 h-6" />
                <span>学習を始める</span>
              </button>
            </div>

            {/* Right Side */}
            <div className="relative">
              <div
                className="h-96 bg-cover bg-center bg-no-repeat rounded-2xl shadow-xl"
                style={{ backgroundImage: `url('/img/exam1.jpg')` }}
              />
              <div className="absolute inset-0 bg-gray-900/10 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ExamRoom;
