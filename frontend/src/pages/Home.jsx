import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import StoriesBar from "../components/StoriesBar";
import Feed from "../components/Feed";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717]">
      <Sidebar />

      <main className="min-h-screen px-4 pb-24 pt-20 md:ml-[220px] md:px-8 md:pb-6 md:pt-6 lg:ml-[240px] lg:mr-[320px]">
        <div className="mx-auto w-full max-w-[620px]">
          <StoriesBar />

          <RightPanel />

          <Feed />
        </div>
      </main>
    </div>
  );
};

export default Home;
