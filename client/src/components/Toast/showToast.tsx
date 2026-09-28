import { toast } from "react-hot-toast";
import { CustomToast } from "./Toast";

export const showSuccessToast = (title: string, message?: string) => {
  toast.custom((t) => (
    <CustomToast
      t={t}
      title={title}
      message={message}
      type="success"
    />
  ));
};

export const showErrorToast = (title: string, message?: string) => {
  let displayMessage = message;
  if (
    displayMessage &&
    (displayMessage.includes("ThrottlerException") ||
      displayMessage.toLowerCase() === "too many requests")
  ) {
    displayMessage = "Too many requests. Try again in 60 seconds";
  }
  toast.custom((t) => (
    <CustomToast
      t={t}
      title={title}
      message={displayMessage}
      type="error"
    />
  ));
};

export const showInfoToast = (title: string, message?: string) => {
  toast.custom((t) => (
    <CustomToast
      t={t}
      title={title}
      message={message}
      type="info"
    />
  ));
};
