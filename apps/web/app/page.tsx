import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      
      <img 
        src="/docmate.png" 
        alt="Docmate 마스코트" 
        className="w-[550px] mb-6 rounded-2xl shadow-lg"
      />

      <h1 className="text-4xl font-bold mb-4">
        AI 문서 파싱 비서 <span className="text-green-700">Docmate</span>
      </h1>
      <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8">
        복잡한 문서를 빠르고 정확하게 구조화하세요.
      </p>
      
      <div className="flex gap-4">
        <Link 
          href="/upload" 
          className="px-6 py-3 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 transition shadow-md"
        >
          새 문서 업로드
        </Link>
        <Link 
          href="/documents" 
          className="px-6 py-3 bg-zinc-200 dark:bg-zinc-800 font-medium rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
        >
          내 문서 보기
        </Link>
      </div>
    </div>
  );
}