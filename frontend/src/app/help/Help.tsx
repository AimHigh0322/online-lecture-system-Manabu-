import React, { useState } from "react";
import {
  BookOpen,
  FileText,
  CreditCard,
  User,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Home,
  Edit,
  Award,
  Settings,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const Help: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sections = [
    {
      id: "getting-started",
      title: "はじめに",
      icon: Home,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Manabou国際研修システムへようこそ。このガイドでは、システムの使い方を詳しく説明します。
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-gray-900 mb-2">システムの特徴</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>24時間いつでもアクセス可能な学習プラットフォーム</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>AI顔認証による試験セキュリティ体制構築</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>修了証明書の発行</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "account",
      title: "アカウント管理",
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">新規登録</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>トップページの「今すぐ登録」ボタンをクリック</li>
              <li>必要な情報（名前、メールアドレス、パスワードなど）を入力</li>
              <li>利用規約に同意して登録を完了</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">ログイン</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>トップページの「ログイン」をクリック</li>
              <li>登録したメールアドレスとパスワードを入力</li>
              <li>ログインボタンをクリック</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              プロフィール管理
            </h4>
            <p className="text-gray-700 text-sm mb-2">
              右上のユーザーアイコンをクリックして「プロフィール」を選択すると、以下の設定が可能です：
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
              <li>プロフィール情報の編集</li>
              <li>アバター画像の変更</li>
              <li>個人情報の更新</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mt-3">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    重要な注意事項
                  </h4>
                  <p className="text-gray-700 text-sm mb-2">
                    プロフィールに登録する名前は、修了証に記載される名前となります。正確な情報を責任を持って入力してください。
                  </p>
                  <p className="text-gray-700 text-sm">
                    購入した講座へのアクセス情報（コース名、パスワードなど）はプロフィールページに表示されます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "courses",
      title: "コースの選択と学習",
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">コースの種類</h4>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-1">
                  一般講習（¥4,500）
                </h5>
                <p className="text-gray-700 text-sm">
                  日常生活や職場で必要な基本的な日本語スキルと文化的知識を習得
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-1">
                  介護講習（¥6,500）
                </h5>
                <p className="text-gray-700 text-sm">
                  介護職に従事するための専門的なスキルと理論的知識を習得
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-1">
                  介護基礎研修（特定）（¥8,500）
                </h5>
                <p className="text-gray-700 text-sm">
                  特定技能外国人向けの介護基礎研修で、指定技能者資格取得を目指す
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-1">
                  介護職員初任者研修（¥7,500）
                </h5>
                <p className="text-gray-700 text-sm">
                  介護職員として必要な基本的な技術と知識を習得する入門コース
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-1">
                  日本語能力試験対策（¥5,500）
                </h5>
                <p className="text-gray-700 text-sm">
                  JLPT各レベルに特化した対策講座で、合格を目指す集中学習
                </p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              コースの購入方法
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>ナビゲーションメニューから「講習内容と費用」を選択</li>
              <li>「購入する」ボタンをクリック</li>
              <li>決済ページで支払い情報を入力</li>
              <li>決済完了後、すぐに学習を開始できます</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">学習の進め方</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>購入したコースの「学習を開始」ボタンをクリック</li>
              <li>
                コースページで学習教材（動画、PDF、ドキュメント）にアクセス
              </li>
              <li>各教材を順番に学習していきます</li>
              <li>
                動画視聴終了後は、プレイヤー機能バーの保存ボタンを押すことで学習完了と記録されます
              </li>
              <li>
                学習動画と文書資料をお気に入りリストに登録し、いつでも閲覧可能です
              </li>
            </ol>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">注意事項</h4>
                <p className="text-gray-700 text-sm">
                  コースの学習を完了しないと、試験を受けることができません。すべての教材を学習してから試験に臨みましょう。
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "exams",
      title: "試験について",
      icon: Edit,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              試験を受ける条件
            </h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>関連するコースの学習を完了していること</li>
              <li>顔認証が正常に完了していること</li>
              <li>試験の有効期限内であること</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">試験の流れ</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>
                <strong>試験ルームへアクセス：</strong>
                ナビゲーションメニューから「試験ルーム」を選択
              </li>
              <li>
                <strong>顔認証：</strong>
                AI顔認証システムにより、本人確認を行います
                <ul className="list-disc list-inside ml-6 mt-1 text-gray-600">
                  <li>カメラで顔を撮影し、登録時の顔写真と照合します</li>
                  <li>明るい場所でカメラの前に座ってください</li>
                  <li>顔がはっきり見えるようにしてください</li>
                  <li>認証が成功すると試験を開始できます</li>
                  <li>
                    このシステムにより、試験のセキュリティが確保されています
                  </li>
                </ul>
              </li>
              <li>
                <strong>試験開始：</strong>
                試験問題に回答していきます
                <ul className="list-disc list-inside ml-6 mt-1 text-gray-600">
                  <li>制限時間内に回答を完了してください</li>
                  <li>回答は自動的に保存されます</li>
                  <li>途中で退出することもできますが、時間は経過します</li>
                </ul>
              </li>
              <li>
                <strong>試験中の顔認証確認：</strong>
                試験中は15分ごとにカメラによる顔認証確認が自動的に行われます
                <ul className="list-disc list-inside ml-6 mt-1 text-gray-600">
                  <li>15分ごとにカメラで顔を撮影し、本人確認を行います</li>
                  <li>
                    この認証確認が正常に完了しない場合、試験を継続できません
                  </li>
                  <li>
                    認証に失敗した場合は、再度顔認証を行うことで試験を継続できます
                  </li>
                  <li>明るい場所でカメラの前に顔を向けてください</li>
                  <li>顔がはっきり見えるようにしてください</li>
                  <li>
                    このシステムにより、試験中のセキュリティが確保されています
                  </li>
                </ul>
              </li>
              <li>
                <strong>結果確認：</strong>
                試験終了後、結果とフィードバックを確認できます
              </li>
              <li>
                <strong>復習：</strong>
                間違えた問題を復習して理解を深めます
              </li>
            </ol>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  試験の注意事項
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>
                    試験中は他のタブやアプリケーションを開かないでください
                  </li>
                  <li>カンニング行為は厳禁です</li>
                  <li>試験時間は延長できません</li>
                  <li>ネットワーク接続が切れた場合、時間は経過し続けます</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "materials",
      title: "学習教材",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">教材の種類</h4>
            <div className="space-y-2 text-gray-700 text-sm">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>動画教材：</strong>
                  講師による解説動画で、視覚的に学習できます
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>PDF教材：</strong>
                  テキストや資料をPDF形式で提供
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>ドキュメント教材：</strong>
                  Word形式などの詳細な資料
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">教材の閲覧方法</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>コース学習ページにアクセス</li>
              <li>教材一覧から閲覧したい教材を選択</li>
              <li>動画はページ内で再生、PDFやドキュメントはダウンロード可能</li>
              <li>
                学習動画と文書資料をお気に入りリストに登録し、いつでも閲覧可能です
              </li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "payment",
      title: "決済について",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">支払い方法</h4>
            <p className="text-gray-700 text-sm mb-2">
              現在、クレジットカード決済に対応しています。
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
              <li>Visa、Mastercard、American Expressなどの主要カードに対応</li>
              <li>安全な決済処理システムを使用</li>
              <li>決済情報は暗号化されて保護されます</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">決済の流れ</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>コース選択ページで希望のコースを選択</li>
              <li>「購入する」ボタンをクリック</li>
              <li>決済ページでカード情報を入力</li>
              <li>確認後、決済を完了</li>
              <li>決済成功後、すぐにコースにアクセス可能</li>
            </ol>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-gray-900 mb-2">返金ポリシー</h4>
            <p className="text-gray-700 text-sm">
              返金に関するお問い合わせは、システム管理者までご連絡ください。各コースの返金条件が異なる場合があります。
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "certificates",
      title: "修了証明書",
      icon: Award,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              証明書の発行条件
            </h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>コースのすべての教材を学習完了していること</li>
              <li>試験で70点以上を取得していること</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              証明書の発行リクエスト
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>
                試験で70点以上を取得すると、自動的に管理者へ修了証発行リクエストが送信されます
              </li>
              <li>
                管理者が通知アイコンから修了証発行リクエストを確認できます
              </li>
              <li>管理者が修了証を発行すると、受講生に通知が送信されます</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "troubleshooting",
      title: "よくある問題と解決方法",
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              ログインできない
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
              <li>メールアドレスとパスワードが正しいか確認してください</li>
              <li>パスワードは大文字・小文字を区別します</li>
              <li>ブラウザのキャッシュをクリアしてみてください</li>
              <li>
                それでも解決しない場合は、パスワードリセットを試してください
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              動画が再生されない
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
              <li>インターネット接続を確認してください</li>
              <li>ブラウザを最新版に更新してください</li>
              <li>別のブラウザで試してみてください</li>
              <li>動画プレーヤーの設定を確認してください</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              顔認証が失敗する
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
              <li>明るい場所でカメラの前に座ってください</li>
              <li>顔がはっきり見えるようにしてください</li>
              <li>カメラのアクセス許可を確認してください</li>
              <li>別のブラウザで試してみてください</li>
              <li>登録時の顔写真と似た環境で撮影してください</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              試験中にエラーが発生した
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
              <li>
                ページをリロードしてみてください（回答は保存されています）
              </li>
              <li>ネットワーク接続を確認してください</li>
              <li>ブラウザのコンソールでエラーメッセージを確認してください</li>
              <li>問題が続く場合は、システム管理者に連絡してください</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              決済が完了しない
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
              <li>カード情報が正しいか確認してください</li>
              <li>カードの有効期限を確認してください</li>
              <li>カードの残高を確認してください</li>
              <li>別のカードで試してみてください</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      title: "お問い合わせ",
      icon: Settings,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              サポートへの連絡方法
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <h5 className="font-medium text-gray-900 mb-1">
                  電話でのお問い合わせ
                </h5>
                <p className="text-gray-700 text-sm">+81 (0)3 1234 5678</p>
                <p className="text-gray-600 text-xs mt-1">
                  営業時間：月曜日-金曜日 9:00-18:00、土曜日 9:00-17:00
                </p>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-1">
                  メールでのお問い合わせ
                </h5>
                <p className="text-gray-700 text-sm">info@manabou-center.com</p>
                <p className="text-gray-600 text-xs mt-1">
                  24時間受付、通常1-2営業日以内に返信いたします
                </p>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-1">所在地</h5>
                <p className="text-gray-700 text-sm">
                  学ぼう国際研修センター
                  <br />
                  〒150-0001 東京都渋谷区神宮前1-1-1 学ぼうビル 3階
                  <br />
                  Tokyo, Japan
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-gray-900 mb-2">
              お問い合わせの際にご準備いただく情報
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
              <li>お名前とメールアドレス</li>
              <li>ご利用中のアカウント情報</li>
              <li>問題が発生した日時と状況</li>
              <li>エラーメッセージ（該当する場合）</li>
              <li>使用しているブラウザとOSの情報</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative w-full h-64 md:h-96 overflow-hidden">
        <img
          src="/img/help.png"
          alt="Help"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-white uppercase mb-2">
              ヘルプ & ガイド
            </h1>
            <p className="text-xl text-white/90">
              オンライン学習システムの使い方ガイド
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <p className="text-lg text-gray-700 leading-relaxed text-center">
            このガイドでは、Manabou国際研修システムの使い方を詳しく説明します。
            各セクションをクリックして詳細を確認してください。
          </p>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSection === section.id;

            return (
              <div
                key={section.id}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {section.title}
                    </h2>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="mt-12 bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            クイックリンク
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/courses"
              className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <BookOpen className="w-5 h-5" />
              <span>コースを選択</span>
            </a>
            <a
              href="/exam-room"
              className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <Edit className="w-5 h-5" />
              <span>試験ルーム</span>
            </a>
            <a
              href="/profile"
              className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <User className="w-5 h-5" />
              <span>プロフィール</span>
            </a>
            <a
              href="/"
              className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <Home className="w-5 h-5" />
              <span>ホームページ</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
