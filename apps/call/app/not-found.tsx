export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Agent Not Found</h1>
        <p className="text-gray-400 text-sm">
          This call link does not exist or has not been configured.
        </p>
      </div>
    </div>
  );
}
