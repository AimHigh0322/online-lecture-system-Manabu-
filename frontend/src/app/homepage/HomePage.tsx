import React from "react";
import { Link } from "react-router-dom";
import { isAuthenticated } from "../../api/auth/authService";

const HomePage: React.FC = () => {
  const authenticated = isAuthenticated();

  return (
    <div className="min-h-screen bg-white">
      {/* Top Utility Bar */}
      <div className="bg-white border-b border-gray-200"></div>

      {/* Hero Section with Full Width Image */}
      <section className="relative">
        {/* Full Width Background Image */}
        <div
          className="w-full h-[450px] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/img/1.png')`,
          }}
        />
        <div className="absolute inset-0 bg-gray-900/50"></div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-4xl">
              {/* Breadcrumbs */}
              <div className="mb-8">
                <p className="text-white text-sm">オンライン日本語レッスン</p>
              </div>

              {/* Main Content */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  学ぼうオンライン日本語学校
                </h1>
                <p className="text-xl text-white mb-8 leading-relaxed">
                  柔軟で個別化されたクラスで日本語のすべての分野をマスターし、いつでもどこでも日本語を学ぶことができます。
                </p>
                {!authenticated ? (
                  <Link
                    to="/register"
                    className="inline-block px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg"
                  >
                    今すぐ登録
                  </Link>
                ) : (
                  <Link
                    to="/courses"
                    className="inline-block px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg"
                  >
                    コースを選択
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Second Section - Image and Dropdown Content */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Image */}
            <div className="relative">
              <div
                className="h-96 bg-cover bg-center bg-no-repeat rounded-2xl shadow-xl"
                style={{
                  backgroundImage: `url('/img/2.png')`,
                }}
              />
              <div className="absolute inset-0 bg-gray-900/20 rounded-2xl"></div>
            </div>

            {/* Right Column - System Introduction */}
            <div className="flex flex-col justify-center pl-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                オンライン学習システムについて
              </h2>

              <div className="space-y-4">
                <p className="text-lg text-gray-700 leading-relaxed">
                  学ぼう国際研修センターの革新的なオンライン日本語学習プラットフォームへようこそ。
                  最新技術と実証された教育手法を組み合わせ、優れた学習体験を提供します。
                </p>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    システムの主な機能
                  </h3>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>AI顔認証による試験セキュリティ体制構築</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>Stripe決済による安全なコース購入</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>24時間アクセス可能な学習プラットフォーム</span>
                    </li>
                  </ul>
                </div>

                <p className="text-lg text-gray-700 leading-relaxed">
                  初心者から上級者まで、あなたのペースに合わせた柔軟な学習環境をご提供します。
                </p>
              </div>

              {/* CTA Button */}
              {!authenticated && (
                <div className="mt-6">
                  <Link
                    to="/register"
                    className="inline-block px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    学習を始める
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
