import { RequirementsFormInput } from "@/util";
import NewReport from "./index.page";
import NewRequest from "./new-request.page";

export default function AllPages() {
  return (
    <div>
      <NewReport/>
      <NewRequest submitRequest={function (x: RequirementsFormInput): void {
        throw new Error("Function not implemented.");
      } }/>
      <Patients/>
    </div>
  )
}
