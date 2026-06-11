import { Suspense } from "react";
import Templates from "./Templates";

const page = () => {
  return (
    <Suspense>
      <Templates />
    </Suspense>
  );
};

export default page;
