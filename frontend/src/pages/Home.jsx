import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import StoriesBar from "../components/StoriesBar";
import Feed from "../components/Feed";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717]">
      <Sidebar />

      <main className="min-h-screen px-4 pb-20 pt-6 md:ml-[240px] md:px-8 lg:mr-[320px]">
        <div className="mx-auto w-full max-w-[620px]">
          <StoriesBar />
          <Feed />
        </div>
      </main>

      <RightPanel />
    </div>
  );
};

export default Home;
