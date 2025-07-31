export const defaultImagesIds = [
  "program/w.yoga1_mprdyz",
  "program/w.yoga2_qtnigw",
  "program/w.yoga3_sxteyf",
  "program/w.yoga4_nbhmrq",
  "program/w.yoga5_hcpswp",
  "program/w.yoga6_c4fy1z",
  "program/w.yoga7_ozb7kt",
  "program/w.yoga8_qq1ieb",
  "program/w.yoga9_tpchxs",
  "program/w.yoga10_m97emp",
  "program/w.yoga11_cgkpqz",
  "program/w.yoga12_tmijzo",
  "program/w.yoga13_shxzwe",
  "program/w.yoga14_hvwihv",
  "program/w.yoga15_nrzu4n",
  "program/w.yoga16_gv23zd",
  "program/w.yoga17_u4ux1t",
  "program/w.yoga18_kxmocr",
  "program/w.yoga19_giie62",
  "program/w.yoga20_s9qh39",
  "program/w.yoga21_pvfubt",
  "program/w.yoga23_texmjn",
  "program/w.yoga24_hjcwys",
  "program/w.yoga25_mltujq",
  "program/w.yoga26_oh1die",
  "program/w.yoga28_gh7x1m",
  "program/w.yoga29_w11ire",
];

export const getRandomDefaultImageId = () => {
  const randomIndex = Math.floor(Math.random() * defaultImagesIds.length);
  const randomImageId = defaultImagesIds[randomIndex];
  return randomImageId;
};
