import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useReducedMotion } from 'framer-motion';
import { MapPin, Calendar, X, Grid, Shuffle, Aperture, Globe, Heart, Play, Layers, ChevronLeft, ChevronRight, Search, Sparkles } from 'lucide-react';
import { GlitchText } from './GlitchText';

// --- Helper Functions ---
/**
 * Convert Google Drive share link to direct viewable/embeddable URL
 * Supports multiple formats:
 * - /file/d/FILE_ID/view
 * - /file/d/FILE_ID/view?usp=drive_link (new format)
 * - /open?id=FILE_ID
 * - /uc?id=FILE_ID
 * 
 * Returns: https://drive.google.com/uc?export=view&id=FILE_ID
 * This format works best with <img> tags and doesn't require authentication
 */
const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return url;

  // Check if it's a Google Drive link
  if (!url.includes('drive.google.com')) {
    return url;
  }

  // Extract file ID from various Google Drive URL formats
  let fileId = '';

  // Format 1: https://drive.google.com/file/d/FILE_ID/view (with or without query params)
  // Example: https://drive.google.com/file/d/1B8jchrhOqwQj8MefBCxXWaPakN5R6lXw/view?usp=drive_link
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    fileId = fileMatch[1];
  }

  // Format 2: https://drive.google.com/open?id=FILE_ID
  if (!fileId) {
    const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openMatch && openMatch[1]) {
      fileId = openMatch[1];
    }
  }

  // Format 3: https://drive.google.com/uc?id=FILE_ID
  if (!fileId) {
    const ucMatch = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
    if (ucMatch && ucMatch[1]) {
      fileId = ucMatch[1];
    }
  }

  // If we found a file ID, return the direct view URL
  if (fileId) {
    // Use uc?export=view&id=FILE_ID for best image compatibility
    // This format works well with img tags and doesn't require authentication
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Fallback: return original URL
  return url;
};

const getVideoPlatform = (url: string): 'youtube' | 'googledrive' | 'direct' => {
  if (!url) return 'direct';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('drive.google.com')) return 'googledrive';
  return 'direct';
};


const optimizeCloudinaryUrl = (url: string) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  if (url.includes('/q_auto') || url.includes('/vc_auto')) return url;
  return url.replace('/upload/', '/upload/q_auto,vc_auto/');
};

// --- Types ---
interface LifeMoment {
  id: string;
  type: 'image' | 'video';
  url: string;
  mediaUrls?: string[];
  videoUrl?: string;
  videoUrls?: string[]; // Support for multiple videos
  videoPlatform?: 'youtube' | 'direct' | 'googledrive';
  category: string[]; // Updated to support multiple categories
  caption: string;
  date: string;
  location: string;
  rotation: number;
  scale: number;
  zIndex: number;
}

// --- Data ---
const LIFE_MOMENTS: LifeMoment[] = [
  // {
  //   id: '1',
  //   type: 'image',
  //   url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop',
  //   category: ['study'],
  //   caption: 'Late night debugging at the campus library.',
  //   date: '2023.11.12',
  //   location: 'NLU Library',
  //   rotation: -5,
  //   scale: 1.1,
  //   zIndex: 1
  // },
  {
    id: '1',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743457/photo_8_2025-11-21_00-32-47_iduwdy.jpg',
    videoUrl: 'https://drive.google.com/file/d/14WDUY4il5pwmTkg_pfGnEzgOr0AYET3j/view',
    videoPlatform: 'googledrive',
    category: ['Thpt', 'memories'], // Multiple categories example
    caption: 'Hành trình đi thi Quân sự Thpt',
    date: '2022.11.19',
    location: 'Số 204 Đường Hoàng Văn Thụ, Phường 9, Tân Bình, Thành phố Hồ Chí Minh, VN',
    rotation: -5,
    scale: 0.9,
    zIndex: 2
  },
  {
    id: '2',
    type: 'image',
    mediaUrls: [
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743457/photo_6_2025-11-21_00-32-47_sfy3mv.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743457/photo_5_2025-11-21_00-32-47_qbvykz.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743456/photo_1_2025-11-21_15-30-48_qd8rq0.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743457/photo_4_2025-11-21_00-32-47_vfskhn.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763744057/photo_3_2025-11-21_00-49-04_b80gfr.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743456/photo_2_2025-11-21_15-30-48_gm6pme.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743455/photo_2_2025-11-21_15-37-34_jyalhx.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743455/photo_1_2025-11-21_15-37-34_funykt.jpg'
    ],
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743147/quan-su-1_r2jgwq.jpg',
    category: ['Thpt', 'achievements'], // Multiple categories example
    caption: 'Thành công tốt đẹp',
    date: '2022.21.22',
    location: 'Số 204 Đường Hoàng Văn Thụ, Phường 9, Tân Bình, Thành phố Hồ Chí Minh, VN',
    rotation: -2,
    scale: 1.0,
    zIndex: 3
  },
  {
    id: '3',
    type: 'image',
    mediaUrls: [
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743465/photo_16_2025-11-21_00-32-47_ykotha.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743465/photo_17_2025-11-21_00-32-47_kghoca.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743466/photo_19_2025-11-21_00-32-47_hmjjk3.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743461/photo_12_2025-11-21_00-32-47_uuk0kn.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743471/photo_1_2025-11-21_00-26-09_kacobr.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743455/photo_1_2025-11-21_15-59-12_y1bgkq.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743463/photo_14_2025-11-21_00-32-47_onxxcw.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743466/photo_15_2025-11-21_00-32-47_y66sjy.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743472/photo_3_2025-11-21_00-26-09_vtb82r.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743459/photo_9_2025-11-21_00-32-47_ha5dlo.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743459/photo_10_2025-11-21_00-32-47_thndsl.jpg'
    ],
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743461/photo_11_2025-11-21_00-32-47_gucco6.jpg',
    category: ['travel', 'adventure', 'friends'], // Multiple categories example
    caption: 'Chạy nước rút 3 ngày 2 đêm tại Đà Lạt',
    date: '2023.01.02',
    location: 'Đà Lạt, Vn',
    rotation: 6,
    scale: 1.05,
    zIndex: 1
  },
  {
    id: '4',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763747971/Screenshot_2025-11-22_0056261_omdt87.png',
    videoUrl: 'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763744077/video_2025-11-21_00-56-19_qy7nhs.mp4',
    videoPlatform: 'direct',
    category: ['hobby', 'thpt', 'travel'],
    caption: 'Tối đó - Chúng tôi đã làm những điều khó hiểu',
    date: '2023.01.03',
    location: 'Đà Lạt, Vn',
    rotation: -4,
    scale: 0.95,
    zIndex: 2
  },
  {
    id: '5',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763745704/photo_1_2025-11-22_00-21-31_aplph1.jpg',
    videoUrl: 'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763743944/dalat_fpfgqt.mp4',
    videoPlatform: 'direct',
    category: ['thpt', 'travel'],
    caption: 'Đà Lạt - Video Log',
    date: '2023.01.04',
    location: 'Đà Lạt, Vn',
    rotation: 2,
    scale: 1.0,
    zIndex: 1
  },
  {
    id: '6',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763748314/photo_1_2025-11-22_01-05-02_rwsyzd.jpg',
    videoUrl: 'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763749805/AQMZp-eYYLMrJITzdT7h3TnyRcUixAN0wvX3TOgVaAbibViP5A9aUSSs2psqzNUHjcysYFm_9ky6rj0UGPM7VAp8J5tT4k2bNXf3GT0nD8MBJw_fuqzys.mp4',
    category: ['Tet', 'sports'],
    caption: 'Mồng 4 đi cày',
    date: '2023.01.26',
    location: 'Xã Thanh Giang, Thanh Chương, Nghệ An, VN',
    rotation: -3,
    scale: 1.0,
    zIndex: 2
  },
  {
    id: '7',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763751715/photo_1_2025-11-22_02-01-24_qsxyzi.jpg',
    videoUrls: [
      'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763750775/AQPP2jr-1psdtttCD_3BDax2FCaLLQotgv6FY5mzRvcepdIL-xJvTyr_I8WUXVNtJMk3YUK6-ikTpUvqLlBURa6MeWmLG-QHjTHaBBdvwDsBmA_ejarfh.mp4',
      'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763749888/AQPwNGfZxe7qZlTgF8AqVuxk0-yepWf75yqhxK2wROITqn5img9G93SMQuV1PSB1zLilyevFIpo8k4rydHrwP3OpVZJu2iMXrr-vlHhLIKSKXQ_u2y9ut.mp4',
      'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763749888/AQO1p4PTJRIZaHP7p-F1Dc5dEJOhJJDzP05T3RAl8KvoOcrq0EKzfp7fR70xuXO8LrxU2-r_CeotJG3vrk7G2GlgfDpyYP6brXk6oTnquBOdJw_byaoi0.mp4'
    ],
    category: ['Thpt', 'sports'],
    caption: 'Tuy thất bại khó tránh nhưng cũng đã rồi, thật may rằng tôi được cùng thầy và đồng đội trải qua giây phút khó quên này.',
    date: '2023.03.05',
    location: '',
    rotation: 4,
    scale: 1.02,
    zIndex: 3
  },
  {
    id: '8',
    type: 'image',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763789051/photo_1_2025-11-22_11-47-29_pqvonx.jpg',
    mediaUrls: [
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743477/photo_9_2025-11-21_00-26-09_r07kyy.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743475/photo_8_2025-11-21_00-26-09_pdcvmh.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763789063/photo_10_2025-11-22_11-47-29_ckauas.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763789065/photo_11_2025-11-22_11-47-29_wuwwj5.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743469/photo_21_2025-11-21_00-32-47_qmu8un.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743468/photo_20_2025-11-21_00-32-47_uwnavi.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743456/photo_3_2025-11-21_00-32-47_nyrldt.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743456/photo_1_2025-11-21_00-32-47_sbvtnp.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763789052/photo_3_2025-11-22_11-47-29_wbmwwd.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743456/photo_2_2025-11-21_00-32-47_eocxbf.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763743478/photo_10_2025-11-21_00-26-09_d3cbxu.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763794882/photo_1_2025-11-22_14-01-06_r4avvx.jpg'
    ],
    category: ['Thpt', 'memories'],
    caption: '12.3 trong tim tôi ♥',
    date: '2023.--.--',
    location: 'THPT Nguyễn Thị Minh Khai, Khu phố Đông Thành, Dĩ An, Bình Dương, VN',
    rotation: 3,
    scale: 1.05,
    zIndex: 1
  },
  {
    id: '9',
    type: 'image',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785567/480186068_1361160138577373_1279055105002201592_n_gj2ikr.jpg',
    mediaUrls: [
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763793275/photo_1_2025-11-22_13-34-14_iey6ij.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785566/479942686_1361160108577376_6000743401496633100_n_onibdy.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785566/479723965_1361160191910701_266770874178017985_n_zz5fvz.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785567/480028705_1361160231910697_8551267807880327286_n_ty7gny.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763793276/photo_2_2025-11-22_13-34-14_loyffe.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785566/480037601_1361160018577385_1267753709221851994_n_kxhxpd.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763794192/photo_2_2025-11-22_13-49-21_n0ircm.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763787123/photo_6_2025-11-22_11-51-36_r8whzf.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763787122/photo_1_2025-11-22_11-51-36_hhaciy.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785604/479518609_1361160148577372_4578185605466268089_n_raciim.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785598/480027609_1361159788577408_5846363678487363928_n_anktko.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785596/480168286_1361159875244066_4295635601315653032_n_vtrc1a.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785585/480240429_1361159935244060_6773971862859177779_n_lvgxi8.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785567/480099741_1361160131910707_4509082663882140072_n_wx8tbl.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785568/479358743_1361159998577387_4192815319300552419_n_huo95n.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785567/479942390_1361159831910737_516067359883892686_n_of85wa.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785568/480026489_1361160141910706_8692871502824399222_n_jfoylk.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785569/480082886_1361160161910704_5512198583421957723_n_rrabpv.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785569/479586338_1361159895244064_7556590117632294206_n_whp7nk.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785569/480104279_1361159868577400_1836770433225696442_n_seezgc.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785567/479711202_1361159965244057_5709855837280579076_n_th9iqs.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763787123/photo_3_2025-11-22_11-51-36_uay8t7.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763787123/photo_4_2025-11-22_11-51-36_ygd93k.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785585/480010026_1361160135244040_8866518398800141021_n_mf4shy.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785585/480109402_1361159888577398_3894367812803705793_n_cm5vwj.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785586/479526337_1361160045244049_3648749453913498261_n_bvqk9w.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785589/479509121_1361159821910738_3629363161545315620_n_b4emot.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785586/480291043_1361160261910694_8685170678198051579_n_1_zlzlbp.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785596/479966324_1361159815244072_3958260816719203071_n_skoihz.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785586/480143467_1361160158577371_7822690208417772565_n_rcgxie.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785604/480079035_1361159838577403_4560320851772349964_n_ydjmwc.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785606/479719759_1361159805244073_7337539317264841540_n_ce8czn.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785606/480063600_1361160091910711_7954319233673996011_n_o7tkj5.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785605/480188477_1361159785244075_7888834059921423244_n_n7pfef.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785613/480212138_1361160111910709_260725641289882755_n_xpaekt.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785613/480148410_1361160228577364_5120005184250528618_n_ld3huz.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785613/479547211_1361160068577380_1263165745724682684_n_t5ep91.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785614/479567908_1361160041910716_6776509381631415959_n_mrdaq7.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785614/480253542_1361160265244027_1339390487126838392_n_g9zrda.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785615/480033731_1361159951910725_1003295322069401841_n_aaahjg.jpg',
      'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763785616/480188150_1361160038577383_3174455203150196381_n_p3tbzm.jpg'

    ],
    category: ['Thpt', 'memories'],
    caption: 'Khép lại hành trình THPT tràn đầy kỷ niệm.',
    date: '2023.07.03',
    location: 'THPT Nguyễn Thị Minh Khai, Khu phố Đông Thành, Dĩ An, Bình Dương, VN',
    rotation: 2,
    scale: 1.05,
    zIndex: 4
  },
  {
    id: '8',
    type: 'video',
    url: 'https://res.cloudinary.com/dak4x4d7u/image/upload/v1763796722/photo_1_2025-11-22_14-27-06_gmzwn8.jpg',
    videoUrl: 'https://res.cloudinary.com/dak4x4d7u/video/upload/v1763753272/Untitled_video_-_Made_with_Clipchamp_cmwhym.mp4',
    category: ['IT', 'memories', 'sports'],
    caption: 'Tôi yêu IT cụa tôii ♥',
    date: '2024.03.27',
    location: 'Nhà thi đấu - Đại học Nông Lâm, khu phố 6, Thủ Đức, Thành phố Hồ Chí Minh',
    rotation: 3,
    scale: 1.05,
    zIndex: 5
  }
];

// --- Components ---

const ControlDeck: React.FC<{
  filter: string;
  setFilter: (f: string) => void;
  layout: 'scatter' | 'grid';
  setLayout: (l: 'scatter' | 'grid') => void;
  categories: string[];
  totalCount: number;
  motionEnabled: boolean;
  isMobile: boolean;
}> = ({ filter, setFilter, layout, setLayout, categories, totalCount, motionEnabled, isMobile }) => {
  return (
    <motion.div
      initial={motionEnabled ? { y: -50, opacity: 0 } : false}
      whileInView={motionEnabled ? { y: 0, opacity: 1 } : undefined}
      viewport={motionEnabled ? { once: true } : undefined}
      transition={motionEnabled ? { duration: 0.8, ease: "easeOut" } : undefined}
      className="relative md:sticky md:top-8 z-40 mx-auto max-w-4xl px-4 mb-16"
    >
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-theme-accent to-transparent opacity-50" />

        <div className="flex flex-col md:flex-row items-center justify-between p-2 md:p-4 gap-4">

          {/* Left: Stats & Search */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
              <Sparkles size={14} className="text-theme-accent" />
              <span className="text-[10px] font-mono text-white/60">MEMORIES: {totalCount.toString().padStart(2, '0')}</span>
            </div>
            <div className="relative flex-1 md:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search archives..."
                aria-label="Search archives"
                className="w-full bg-black/20 border border-white/10 rounded-full py-1.5 pl-8 pr-4 text-xs text-white focus:outline-none focus:border-theme-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Center: Categories */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0 mask-linear-fade">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filter === cat
                  ? 'text-black bg-theme-accent shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                {filter === cat && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-theme-accent rounded-full -z-10"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Right: Layout Toggles */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setLayout('scatter')}
              disabled={isMobile}
              className={`p-1.5 rounded-md transition-all ${layout === 'scatter' ? 'bg-white/10 text-theme-accent shadow-inner' : 'text-white/40 hover:text-white'} ${isMobile ? 'opacity-40 cursor-not-allowed' : ''}`}
              title="3D Scatter"
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={() => setLayout('grid')}
              className={`p-1.5 rounded-md transition-all ${layout === 'grid' ? 'bg-white/10 text-theme-accent shadow-inner' : 'text-white/40 hover:text-white'}`}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Memoized PhotoCard3D component để tránh re-render không cần thiết
const PhotoCard3D: React.FC<{
  photo: LifeMoment;
  index: number;
  layout: 'scatter' | 'grid';
  onSelect: (photo: LifeMoment) => void;
  motionEnabled: boolean;
  isMobile: boolean;
}> = React.memo(({ photo, index, layout, onSelect, motionEnabled, isMobile }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMobileDevice = isMobile;

  const lazyRootMargin = isMobileDevice ? '100px' : '200px';

  // IntersectionObserver để lazy render content
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: lazyRootMargin, threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [lazyRootMargin]);

  // Mouse tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  useEffect(() => {
    if (!motionEnabled) {
      x.set(0);
      y.set(0);
    }
  }, [motionEnabled, x, y]);

  // Debounce mouse events để giảm rerender - chỉ update 60fps
  const lastUpdate = useRef(0);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Skip trên mobile
    if (!motionEnabled || isMobileDevice) return;

    const now = Date.now();
    if (now - lastUpdate.current < 16) return; // ~60fps cap
    lastUpdate.current = now;

    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    if (!motionEnabled || isMobileDevice) return;
    x.set(0);
    y.set(0);
  };

  // Scroll Parallax for Scatter Mode - Giảm tải trên mobile
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Giảm parallax range trên mobile để nhẹ hơn
  const parallaxY = useTransform(scrollYProgress, [0, 1], isMobileDevice ? [30, -30] : [100, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Random positioning for scatter - Stable với useMemo
  const randomOffset = useMemo(() => ({
    x: (index % 2 === 0 ? -1 : 1) * (Math.random() * 20 + 10),
    y: Math.random() * 50,
    z: Math.random() * 20 // slight depth variance
  }), [index]);

  return (
    <motion.div
      ref={ref}
      layout={motionEnabled}
      initial={motionEnabled ? { opacity: 0, scale: 0.8 } : false}
      whileInView={motionEnabled ? { opacity: 1, scale: 1 } : undefined}
      viewport={motionEnabled ? { once: true, margin: "-10%" } : undefined}
      transition={motionEnabled ? { duration: 0.6, delay: Math.min(index * 0.05, 0.3) } : undefined} // Cap delay để không chờ quá lâu
      className={`relative group perspective-1000 photo-card-3d ${layout === 'scatter'
        ? 'w-full md:w-[45%] mb-24 md:mb-0'
        : 'w-full aspect-[4/5]'
        }`}
      style={{
        marginLeft: layout === 'scatter' ? (index % 2 === 0 ? '5%' : '50%') : 0,
        y: layout === 'scatter' && motionEnabled ? parallaxY : 0,
        zIndex: photo.zIndex
      }}
      onClick={() => onSelect(photo)}
      onMouseMove={motionEnabled ? handleMouseMove : undefined}
      onMouseLeave={motionEnabled ? handleMouseLeave : undefined}
    >
      <motion.div
        style={{
          // Disable 3D transforms trên mobile để nhẹ hơn
          rotateX: layout === 'scatter' && motionEnabled && !isMobileDevice ? rotateX : 0,
          rotateY: layout === 'scatter' && motionEnabled && !isMobileDevice ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full h-full cursor-pointer"
      >
        {/* Glass Card Container - Bỏ backdrop-blur trên mobile qua CSS */}
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-theme-accent/50 group-hover:shadow-[0_0_30px_rgba(var(--color-accent-rgb),0.2)]">

          {/* Image với Skeleton Loading */}
          <div className="relative aspect-[4/5] overflow-hidden">
            {/* Skeleton loader */}
            {!imageLoaded && (
              <div className={`absolute inset-0 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] ${motionEnabled ? 'animate-pulse' : ''}`} />
            )}
            {/* Chỉ load image khi visible */}
            {isVisible && (
              <img
                src={convertGoogleDriveUrl(photo.url)}
                alt={photo.caption}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  } group-hover:scale-110`}
              />
            )}

            {/* Cinematic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

            {/* Floating Icons */}
            <div className="absolute top-4 right-4 flex gap-2">
              {photo.type === 'video' && (
                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/20">
                  <Play size={14} className="text-white ml-0.5" />
                </div>
              )}
              {((photo.mediaUrls && photo.mediaUrls.length > 1) || (photo.videoUrls && photo.videoUrls.length > 1)) && (
                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/20">
                  <Layers size={14} className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Info Panel (Slide Up) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1">
                {photo.category.map((cat, i) => (
                  <span key={i} className="text-[10px] font-mono uppercase tracking-widest text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded border border-theme-accent/20">
                    {cat}
                  </span>
                ))}
              </div>
              <span className="text-[10px] font-mono text-white/60 flex items-center gap-1">
                <Calendar size={10} /> {photo.date}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-theme-accent transition-colors">
              {photo.caption}
            </h3>

            {/* Hidden Details that appear on hover */}
            <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
              <div className="pt-3 mt-3 border-t border-white/10 flex items-center gap-2 text-[10px] text-white/50 font-mono">
                <MapPin size={10} />
                {photo.location}
              </div>
            </div>
          </div>
        </div>

        {/* 3D Depth Layers (Decorative) */}
        <div
          className="absolute -inset-1 bg-theme-accent/20 rounded-xl blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 life-gallery-depth-layer"
        />
      </motion.div>
    </motion.div>
  );
});

// --- Main Component ---

interface LifeGalleryProps {
  onVideoOverlayChange?: (isOpen: boolean) => void;
}

export const LifeGallery: React.FC<LifeGalleryProps> = ({ onVideoOverlayChange }) => {
  const [layout, setLayout] = useState<'scatter' | 'grid'>(() => (
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'scatter'
  ));
  const [filter, setFilter] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<LifeMoment | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [videoLoading, setVideoLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const prefersReducedMotion = useReducedMotion();
  const isVideoLightboxOpen = selectedPhoto?.type === 'video';
  const isLightboxOpen = Boolean(selectedPhoto);
  const motionEnabled = !prefersReducedMotion && !isVideoLightboxOpen && !isMobile;

  // Force grid on mobile
  useEffect(() => {
    if (isMobile) setLayout('grid');
  }, [isMobile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset media index and video loading state
  useEffect(() => {
    if (selectedPhoto) {
      setCurrentMediaIndex(0);
      setVideoLoading(true);
    }
  }, [selectedPhoto]);

  // Reset video loading when changing media index
  useEffect(() => {
    setVideoLoading(true);
  }, [currentMediaIndex]);

  useEffect(() => {
    if (!onVideoOverlayChange) return;
    onVideoOverlayChange(Boolean(isVideoLightboxOpen));
    return () => onVideoOverlayChange(false);
  }, [isVideoLightboxOpen, onVideoOverlayChange]);

  useEffect(() => {
    if (!isLightboxOpen || typeof window === 'undefined') return;
    const scrollY = window.scrollY;
    const body = document.body;
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      body.style.overflow = previous.overflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      // Sử dụng requestAnimationFrame để đảm bảo scrollTo được gọi sau khi browser repaint
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' });
      });
    };
  }, [isLightboxOpen]);

  // Filter logic: Support multiple categories per moment
  // Uses .includes() to check if selected category exists in the moment's category array
  // This allows moments with multiple categories to appear when any of their categories is selected
  const filteredPhotos = useMemo(() => {
    return filter === 'all' ? LIFE_MOMENTS : LIFE_MOMENTS.filter(p => p.category.includes(filter));
  }, [filter]);

  // Extract all unique categories from all moments (including moments with multiple categories)
  const categories = useMemo(() => {
    const allCategories = LIFE_MOMENTS.flatMap(p => p.category);
    return ['all', ...Array.from(new Set(allCategories))];
  }, []);

  // Lightbox handlers
  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhoto) {
      const urls = selectedPhoto.type === 'video' && selectedPhoto.videoUrls ? selectedPhoto.videoUrls : selectedPhoto.mediaUrls;
      if (urls) {
        setCurrentMediaIndex((prev) => (prev + 1) % urls.length);
      }
    }
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhoto) {
      const urls = selectedPhoto.type === 'video' && selectedPhoto.videoUrls ? selectedPhoto.videoUrls : selectedPhoto.mediaUrls;
      if (urls) {
        setCurrentMediaIndex((prev) => (prev - 1 + urls.length) % urls.length);
      }
    }
  };

  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === 'youtube') {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0`;
    }
    if (platform === 'googledrive') {
      // Extract file ID from various Google Drive URL formats
      let fileId = '';

      // Format 1: /file/d/FILE_ID/view (with or without query params like ?usp=drive_link)
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch && fileMatch[1]) {
        fileId = fileMatch[1];
      }

      // Format 2: open?id=FILE_ID
      if (!fileId) {
        const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (openMatch && openMatch[1]) {
          fileId = openMatch[1];
        }
      }

      if (fileId) {
        // Use /preview endpoint for video embedding
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
      // Fallback to simple replace
      return url.replace('/view', '/preview');
    }
    return url;
  };

  const lightbox = (
    <AnimatePresence>
      {selectedPhoto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // Bỏ backdrop-blur để giảm tải GPU khi xem video
          className="fixed inset-0 z-[9999] bg-black/98 flex items-stretch justify-center p-0 md:p-8"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close Button */}
          <button
            aria-label="Close lightbox"
            className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-theme-accent hover:text-black transition-all"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={24} />
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full h-full md:max-w-7xl md:h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-none md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Area */}
            <div className="relative w-full md:w-3/4 h-[45vh] md:h-full bg-black flex items-center justify-center group flex-none">
              {selectedPhoto.type === 'video' ? (
                (() => {
                  const currentVideoUrl = selectedPhoto.videoUrls && selectedPhoto.videoUrls.length > 0
                    ? selectedPhoto.videoUrls[currentMediaIndex]
                    : selectedPhoto.videoUrl;

                  // Determine platform for the current video
                  const currentPlatform = selectedPhoto.videoUrls && selectedPhoto.videoUrls.length > 0
                    ? getVideoPlatform(currentVideoUrl || '')
                    : (selectedPhoto.videoPlatform || 'direct');

                  if (!currentVideoUrl) return null;

                  return (
                    <>
                      {/* Video Loading Spinner */}
                      {videoLoading && currentPlatform === 'direct' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                          <div className="w-12 h-12 border-4 border-theme-accent/30 border-t-theme-accent rounded-full animate-spin" />
                        </div>
                      )}
                      {currentPlatform === 'direct' ? (
                        <video
                          key={currentVideoUrl}
                          src={optimizeCloudinaryUrl(currentVideoUrl)}
                          className="w-full h-full object-contain"
                          controls
                          playsInline
                          preload="metadata"
                          onLoadedData={() => setVideoLoading(false)}
                        />
                      ) : (
                        <iframe
                          key={currentVideoUrl} // Force re-render on change
                          src={getEmbedUrl(currentVideoUrl, currentPlatform)}
                          className="w-full h-full"
                          title={selectedPhoto.caption || "Embedded video player"}
                          // Mobile: lazy để giảm gánh network & CPU khi mở lightbox
                          loading={isMobile ? 'lazy' : 'eager'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}

                      {/* Navigation for multiple videos */}
                      {selectedPhoto.videoUrls && selectedPhoto.videoUrls.length > 1 && (
                        <>
                          <button onClick={handlePrevMedia} aria-label="Previous video" className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-theme-accent hover:text-black transition-all opacity-0 group-hover:opacity-100">
                            <ChevronLeft size={24} />
                          </button>
                          <button onClick={handleNextMedia} aria-label="Next video" className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-theme-accent hover:text-black transition-all opacity-0 group-hover:opacity-100">
                            <ChevronRight size={24} />
                          </button>
                          {/* Video Counter */}
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/50 backdrop-blur rounded-full border border-white/10 text-xs font-mono text-white/80">
                            {currentMediaIndex + 1} / {selectedPhoto.videoUrls.length}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()
              ) : (
                <>
                  <img
                    src={selectedPhoto.mediaUrls ? convertGoogleDriveUrl(selectedPhoto.mediaUrls[currentMediaIndex]) : convertGoogleDriveUrl(selectedPhoto.url)}
                    alt={selectedPhoto.caption}
                    className="w-full h-full object-contain"
                  />
                  {selectedPhoto.mediaUrls && selectedPhoto.mediaUrls.length > 1 && (
                    <>
                      <button onClick={handlePrevMedia} aria-label="Previous image" className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-theme-accent hover:text-black transition-all opacity-0 group-hover:opacity-100">
                        <ChevronLeft size={24} />
                      </button>
                      <button onClick={handleNextMedia} aria-label="Next image" className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-theme-accent hover:text-black transition-all opacity-0 group-hover:opacity-100">
                        <ChevronRight size={24} />
                      </button>
                      {/* Image Counter */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/50 backdrop-blur rounded-full border border-white/10 text-xs font-mono text-white/80">
                        {currentMediaIndex + 1} / {selectedPhoto.mediaUrls.length}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Info Sidebar */}
            <div className="w-full md:w-1/4 flex-1 md:flex-none md:h-full bg-[#111] border-t border-white/5 md:border-t-0 md:border-l p-6 md:p-8 flex flex-col overflow-y-auto">
              <div className="flex items-center gap-2 mb-6 opacity-50">
                <Globe size={14} />
                <span className="text-[10px] font-mono uppercase tracking-widest">Data Log #{selectedPhoto.id}</span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{selectedPhoto.caption}</h2>

              <div className="space-y-6 mt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Date</span>
                  <span className="text-sm text-white/80 flex items-center gap-2"><Calendar size={14} /> {selectedPhoto.date}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Location</span>
                  <span className="text-sm text-white/80 flex items-center gap-2"><MapPin size={14} /> {selectedPhoto.location}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Category</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.category.map((cat, i) => (
                      <span key={i} className="inline-flex self-start items-center px-2 py-1 rounded bg-theme-accent/10 text-theme-accent text-xs font-bold border border-theme-accent/20">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8">
                <button className="w-full py-3 rounded border border-white/10 hover:bg-white/5 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest transition-all group">
                  <Heart size={16} className="group-hover:text-red-500 transition-colors" />
                  Add to Favorites
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <section className="relative py-32 bg-theme-bg text-theme-text overflow-hidden min-h-screen">

        {/* Ambient Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] bg-theme-accent/5 rounded-full blur-[100px] ${motionEnabled ? 'animate-pulse-slow' : ''}`} />
          <div className={`absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] ${motionEnabled ? 'animate-pulse-slow delay-1000' : ''}`} />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">

          {/* Header */}
          <div className="mb-24 text-center md:text-left">
            <motion.div
              initial={motionEnabled ? { opacity: 0, y: 20 } : false}
              whileInView={motionEnabled ? { opacity: 1, y: 0 } : undefined}
              viewport={motionEnabled ? { once: true } : undefined}
              className="flex items-center justify-center md:justify-start gap-2 text-theme-accent opacity-80 mb-4"
            >
              <Aperture size={16} className={motionEnabled ? "animate-spin-slow" : ""} />
              <span className="font-mono text-xs uppercase tracking-[0.2em]">Chronosphere // Archive</span>
            </motion.div>

            <GlitchText
              text="Visual Memories."
              className="text-[12vw] md:text-[7vw] leading-[0.8] font-black tracking-tighter text-center md:text-left"
              highlightWord="Memories"
            />
          </div>

          {/* Control Deck */}
          <ControlDeck
            filter={filter}
            setFilter={setFilter}
            layout={layout}
            setLayout={setLayout}
            categories={categories}
            totalCount={filteredPhotos.length}
            motionEnabled={motionEnabled}
            isMobile={isMobile}
          />

          {/* Gallery Grid / Scatter */}
          <div
            ref={containerRef}
            className={`relative min-h-[80vh] transition-all duration-700 ${layout === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
              : 'flex flex-wrap justify-center'
              } ${isVideoLightboxOpen ? 'invisible' : ''}`}
          >
            <AnimatePresence mode="popLayout">
              {filteredPhotos.map((photo, index) => (
                <PhotoCard3D
                  key={photo.id}
                  photo={photo}
                  index={index}
                  layout={layout}
                  onSelect={setSelectedPhoto}
                  motionEnabled={motionEnabled}
                  isMobile={isMobile}
                />
              ))}
            </AnimatePresence>

            {filteredPhotos.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
                <Globe size={48} className={`mb-4 text-theme-accent ${motionEnabled ? 'animate-pulse' : ''}`} />
                <p className="font-mono text-sm">NO_DATA_FOUND_IN_SECTOR</p>
              </div>
            )}
          </div>

        </div>
      </section>
      {typeof document !== 'undefined' ? createPortal(lightbox, document.body) : lightbox}
    </>
  );
};
