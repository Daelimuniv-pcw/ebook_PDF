import type { PhotoPage } from '../types/album';

export const SAMPLE_ALBUM_TITLE = '빛이 머문 오후의 기록';
export const SAMPLE_ALBUM_SUBTITLE = '천천히 걸으며 담아낸 세 장면';
export const SAMPLE_ALBUM_AUTHOR = '모노그래프';
export const SAMPLE_ALBUM_DATE = '2026. 11. 26';
export const SAMPLE_CLOSING_MESSAGE =
  '잠시 멈춰 서서 바라본 빛과 그림자들이\n오래도록 따뜻한 기억으로 남기를 바랍니다.';

export const SAMPLE_PHOTO_PAGES: PhotoPage[] = [
  {
    id: 'sample-1',
    src: '/src/assets/images/sample_morning_cafe_1795738767099.jpg',
    fileName: 'morning-cafe.jpg',
    title: '창가의 첫 커피',
    description:
      '리넨 커튼 사이로 아침 햇살이 길게 들어오던 작은 카페의 구석 자리. 따뜻한 머그잔과 펼쳐둔 스케치북 위로 고요한 하루가 천천히 시작되었다.',
    aspectRatio: 4 / 3,
    isObjectUrl: false,
  },
  {
    id: 'sample-2',
    src: '/src/assets/images/sample_coastal_walk_1795738768177.jpg',
    fileName: 'coastal-walk.jpg',
    title: '안개 낀 부두 끝에서',
    description:
      '해 질 무렵 바닷바람이 잦아들자 수평선과 하늘의 경계가 은빛 안개 속으로 부드럽게 녹아내렸다. 물결 위로 번지는 잔잔한 파문을 한참 동안 바라보았다.',
    aspectRatio: 4 / 3,
    isObjectUrl: false,
  },
  {
    id: 'sample-3',
    src: '/src/assets/images/sample_botanical_shadow_1795738768148.jpg',
    fileName: 'botanical-shadow.jpg',
    title: '온실의 오후',
    description:
      '유리 천장을 통과한 늦은 오후의 빛이 짙은 초록 잎맥마다 투명하게 내려앉았다. 돌바닥에 새겨진 기하학적인 그림자를 따라 걸으며 계절의 온기를 남겼다.',
    aspectRatio: 4 / 3,
    isObjectUrl: false,
  },
];
