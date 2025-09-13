import { Group, Center, Text, Badge } from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import { Link } from "react-router-dom";
import { buildPageUrl } from "@/features/page/page.utils";
import { getPageIcon } from "@/lib";
import { IPageSearch } from "@/features/search/types/search.types";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";

interface SearchResultItemProps {
  result: IPageSearch;
  isAttachmentResult: boolean;
  showSpace?: boolean;
}

export function SearchResultItem({
  result,
  isAttachmentResult,
  showSpace,
}: SearchResultItemProps) {
  const { t } = useTranslation();

  const pageResult = result as IPageSearch;
  return (
    <Spotlight.Action
      component={Link}
      //@ts-ignore
      to={buildPageUrl(
        pageResult.space.slug,
        pageResult.slugId,
        pageResult.title
      )}
      style={{ userSelect: "none" }}
    >
      <Group wrap="nowrap" w="100%">
        <Center>{getPageIcon(pageResult?.icon)}</Center>

        <div style={{ flex: 1 }}>
          <Text>{pageResult.title}</Text>

          {showSpace && pageResult.space && (
            <Badge variant="light" size="xs" color="gray">
              {pageResult.space.name}
            </Badge>
          )}

          {pageResult?.highlight && (
            <Text
              opacity={0.6}
              size="xs"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(pageResult.highlight, {
                  ALLOWED_TAGS: ["mark", "em", "strong", "b"],
                  ALLOWED_ATTR: [],
                }),
              }}
            />
          )}
        </div>
      </Group>
    </Spotlight.Action>
  );
}
