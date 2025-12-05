const getBaseAppUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (!baseUrl) {
    return '';
  }
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

interface BuildMetadataUriParams {
  projectId?: string;
  projectKey?: string;
}

export const buildProjectMetadataUri = ({
  projectId,
  projectKey,
}: BuildMetadataUriParams) => {
  if (!projectId && !projectKey) {
    throw new Error('buildProjectMetadataUri requires a projectId or projectKey');
  }

  const inputPayload = projectId ? { id: projectId } : { key: projectKey! };
  const query = encodeURIComponent(JSON.stringify(inputPayload));
  const baseUrl = getBaseAppUrl();

  if (baseUrl) {
    return `${baseUrl}/api/trpc/project.get?input=${query}`;
  }

  // Fallback to relative path if base URL is not configured
  return `/api/trpc/project.get?input=${query}`;
};
