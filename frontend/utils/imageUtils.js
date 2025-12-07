const DEFAULT_SHOP_IMAGE =
  'data:image/svg+xml,%3Csvg%20xmlns%3D%22http://www.w3.org/2000/svg%22%20width%3D%22400%22%20height%3D%22300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20fill%3D%22%23999%22%3ENo%20Image%3C/text%3E%3C/svg%3E';

const getBaseUrl = () => (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');

export const getDefaultShopImage = () => DEFAULT_SHOP_IMAGE;

export const resolveShopImageSrc = (imagePath, fallback = DEFAULT_SHOP_IMAGE) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return fallback;
  }

  const trimmed = imagePath.trim();

  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }

  if (trimmed.startsWith('http') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const baseUrl = getBaseUrl();
  return `${baseUrl}${normalizedPath}`;
};


