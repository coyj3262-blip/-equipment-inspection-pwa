import Header from "../components/ui/Header";
import SopLibrary from "./SopLibrary";

export default function SopLibraryPage() {
  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title="SOP Library"
        subtitle="Standard Operating Procedures"
      />

      <div className="animate-fadeIn">
        <SopLibrary />
      </div>
    </div>
  );
}

