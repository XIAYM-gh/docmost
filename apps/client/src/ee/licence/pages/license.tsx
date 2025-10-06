import { Helmet } from "react-helmet-async";
import { getAppName } from "@/lib/config.ts";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import useUserRole from "@/hooks/use-user-role.tsx";
import InstallationDetails from "@/ee/licence/components/installation-details.tsx";
import OssDetails from "@/ee/licence/components/oss-details.tsx";
import { useTranslation } from "react-i18next";

export default function License() {
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>
          {t("License")} - {getAppName()}
        </title>
      </Helmet>

      <SettingsTitle title={t("License")} />

      <InstallationDetails />
      <OssDetails />
    </>
  );
}
