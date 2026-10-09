import { MEDIA_UPLOAD_HELP } from '@/lib/media-policy';

export default function OJMediaDescription() {
  return <div className="oj-media-description">
    <p>{MEDIA_UPLOAD_HELP}</p>
    <p>Если фото больше 10 МБ, сожмите его в <a href="https://squoosh.app/" target="_blank" rel="noopener noreferrer">Squoosh</a> (откроется в новой вкладке). Выберите WebP и сравните качество с оригиналом перед сохранением.</p>
  </div>;
}
