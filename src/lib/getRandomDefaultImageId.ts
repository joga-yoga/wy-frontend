export const defaultImagesIds = [
  "w.yoga2_qtnigw_p2gegq",
  "w.yoga1_mprdyz_hasbo9",
  "w.yoga3_sxteyf_nvsdox",
  "w.yoga4_nbhmrq_f44xvb",
  "w.yoga5_hcpswp_ut4rp9",
  "w.yoga6_c4fy1z_l8s9yv",
  "w.yoga7_ozb7kt_zauq8e",
  "w.yoga8_qq1ieb_zwwxq7",
  "w.yoga9_tpchxs_xri7aq",
  "w.yoga10_m97emp_jrljog",
  "w.yoga11_cgkpqz_htctb1",
  "w.yoga12_tmijzo_shae6o",
  "w.yoga13_shxzwe_ldydmw",
  "w.yoga14_hvwihv_cczbme",
  "w.yoga15_nrzu4n_w7hdrg",
  "w.yoga16_gv23zd_rztyee",
  "w.yoga17_u4ux1t_t5rc9o",
  "w.yoga18_kxmocr_aglkiw",
  "w.yoga19_giie62_rasdhy",
  "w.yoga20_s9qh39_it44sz",
  "w.yoga21_pvfubt_v6tund",
  "w.yoga23_texmjn_mqvrxl",
  "w.yoga24_hjcwys_kb8tam",
  "w.yoga25_mltujq_mxwfxu",
  "w.yoga26_oh1die_pqvlad",
  "w.yoga28_gh7x1m_gb5ap5",
  "w.yoga29_w11ire_wvhgq3",
];

export const getRandomDefaultImageId = () => {
  const randomIndex = Math.floor(Math.random() * defaultImagesIds.length);
  const randomImageId = defaultImagesIds[randomIndex];
  return randomImageId;
};
