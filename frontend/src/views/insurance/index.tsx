import useRToken from "hooks/useRToken";
import { Navigate } from "react-router-dom";
import InsurancePage from "./Insurance";

export default () => {
    const rToken = useRToken();

    if (rToken?.isRSV) {
        return <Navigate to="/" />;
    }

    return <InsurancePage />;
};
