const API_ROOT = process.env.REACT_APP_API_ROOT || 'http://localhost:4000';
export default function api(path){
  if(path.startsWith('/')) return API_ROOT + path;
  return API_ROOT + '/' + path;
}
