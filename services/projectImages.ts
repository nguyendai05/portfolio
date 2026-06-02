const CLOUDINARY_FETCH_BASE =
  'https://res.cloudinary.com/dak4x4d7u/image/fetch/f_auto,q_auto,w_1000/';

const CLOUDINARY_UPLOAD_MARKER = '/image/upload/';
const CLOUDINARY_TRANSFORMED_UPLOAD_MARKER = '/image/upload/f_auto,';

export function getOptimizedProjectImage(source: string): string {
  if (!source) return source;

  if (source.includes('api.microlink.io')) {
    return `${CLOUDINARY_FETCH_BASE}${encodeURIComponent(source)}`;
  }

  if (
    source.includes('res.cloudinary.com/dak4x4d7u/image/upload/') &&
    !source.includes(CLOUDINARY_TRANSFORMED_UPLOAD_MARKER)
  ) {
    return source.replace(CLOUDINARY_UPLOAD_MARKER, '/image/upload/f_auto,q_auto,w_1000/');
  }

  return source;
}
