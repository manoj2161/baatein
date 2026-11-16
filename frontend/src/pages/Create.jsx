import Sidebar from "../components/Sidebar";
import CreatePost from "../components/CreatePost";

const Create = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717]">
      <Sidebar />

      <main className="min-h-screen px-4 pb-24 pt-20 md:ml-[220px] md:px-8 md:pb-8 md:pt-8 lg:ml-[240px]">
        <div className="mx-auto w-full max-w-[650px]">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>

            <p className="mt-1 text-sm text-gray-500">
              Share photos and videos with your followers.
            </p>
          </div>

          <CreatePost />
        </div>
      </main>
    </div>
  );
};

export default Create;
