import { assets } from '@/utilities';

export type Voice =
  'wait_qrcode_scan' |
  'wait_insert_power' |
  'device_configurating' |
  'device_self_testing' |
  'devce_ready' |
  'invalid_qrcode';

export function play(voice: Voice) {
  const audio = new Audio(assets(`/audio/${voice}.mp3`));
  audio.play();
}
