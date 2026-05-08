export default function Skeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
      <div className="bg-gray-200 aspect-[3/4] rounded-xl mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}