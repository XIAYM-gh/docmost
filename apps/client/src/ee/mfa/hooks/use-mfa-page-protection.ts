import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import APP_ROUTE from "@/lib/app-route";
import { validateMfaAccess } from "@/ee/mfa";

export function useMfaPageProtection() {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const result = await validateMfaAccess();
      setIsValidating(false);
      setIsValid(result.valid);

      if (!result.valid) {
        navigate(APP_ROUTE.AUTH.LOGIN);
        return;
      }
    };

    checkAccess();
  }, [navigate]);

  return { isValidating, isValid };
}
