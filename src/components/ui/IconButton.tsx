import Image from "next/image";

function IconButton() {
  return (
    <button
      onClick={() => {
        console.log("cl;iked");
      }}
      type="button"
      className="cursor-pointer w-24 h-24 flex justify-center items-center border-6 border-b-gray-900 rounded-2xl bg-orange-200 shadow-md"
    >
      <Image
        src="/assets/icons/market.png"
        alt="Icon"
        width={60}
        height={60}
        priority
        className="object-contain"
      />
    </button>
  );
}

export default IconButton;
