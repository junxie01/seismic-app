// 模拟期刊数据
export const mockJournals = [
  {
    id: 1,
    title: 'JGR: Solid Earth',
    subtitle: 'Journal of Geophysical Research',
  },
  {
    id: 2,
    title: 'GRL',
    subtitle: 'Geophysical Research Letters',
  },
  {
    id: 3,
    title: 'BSSA',
    subtitle: 'Bulletin of the Seismological Society of America',
  },
  {
    id: 4,
    title: 'EPSL',
    subtitle: 'Earth and Planetary Science Letters',
  },
  {
    id: 5,
    title: 'Nature Geoscience',
    subtitle: 'Nature Geoscience',
  },
  {
    id: 6,
    title: 'Science',
    subtitle: 'Science',
  },
];

// 模拟论文数据
export const mockPapers = [
  {
    id: 1,
    journalId: 1,
    title: 'Strength α-Quartz: New Results From High Pressure In Situ X-Ray Diffraction Experiments',
    authors: 'D. A. Jivanjee Medina, S. Kaboli, B. M. Patterson...',
    date: '2026-02',
    doi: '10.1029/2025jb032753',
    url: 'https://doi.org/10.1029/2025jb032753',
  },
  {
    id: 2,
    journalId: 1,
    title: 'Chemical-Thermomechanical Modeling of Open-System Mass Transfer: Application to the Subduction Interface...',
    authors: 'Jun Ren, Manuele Faccenda, Xin Zhong...',
    date: '2026-02',
    doi: '10.1029/2025jb032901',
    url: 'https://doi.org/10.1029/2025jb032901',
  },
  {
    id: 3,
    journalId: 2,
    title: 'Rapid Rupture Propagation During the 2023 Mw 7.8 Turkey Earthquake',
    authors: 'H. Wang, J. Chen, Y. Liu...',
    date: '2026-01',
    doi: '10.1029/2025gl111234',
    url: 'https://doi.org/10.1029/2025gl111234',
  },
  {
    id: 4,
    journalId: 3,
    title: 'Seismic Source Parameters of Recent Major Earthquakes',
    authors: 'K. Smith, L. Johnson, M. Brown...',
    date: '2026-03',
    doi: '10.1785/0120250045',
    url: 'https://doi.org/10.1785/0120250045',
  },
  {
    id: 5,
    journalId: 4,
    title: 'Mantle Transition Zone Structure Beneath the Tibetan Plateau',
    authors: 'Z. Li, W. Zhang, C. Wang...',
    date: '2026-02',
    doi: '10.1016/j.epsl.2025.118456',
    url: 'https://doi.org/10.1016/j.epsl.2025.118456',
  },
  {
    id: 6,
    journalId: 5,
    title: 'Climate Change Impacts on Seismic Activity',
    authors: 'A. Garcia, B. Thompson, R. Lee...',
    date: '2026-01',
    doi: '10.1038/s41561-025-01123-x',
    url: 'https://doi.org/10.1038/s41561-025-01123-x',
  },
  {
    id: 7,
    journalId: 6,
    title: 'Novel Method for Earthquake Early Warning',
    authors: 'M. Johnson, S. Chen, T. Wilson...',
    date: '2026-03',
    doi: '10.1126/science.adg8765',
    url: 'https://doi.org/10.1126/science.adg8765',
  },
];

// 模拟学者数据
export const mockScholars = [
  {
    id: 1,
    name: '宋晓东',
    affiliation: '北京大学',
    research: '地震学研究',
    bio: '宋晓东教授是北京大学地球与空间科学学院教授，主要从事地震学和地球内部结构研究。',
    papers: 150,
    citations: 5000,
  },
  {
    id: 2,
    name: '陈运泰',
    affiliation: '中国科学院',
    research: '地震学与地球物理',
    bio: '陈运泰院士是中国科学院院士，主要研究领域为地震学和地球物理学。',
    papers: 200,
    citations: 8000,
  },
  {
    id: 3,
    name: '张培震',
    affiliation: '中国地震局',
    research: '活动构造与地震预报',
    bio: '张培震院士是中国地震局研究员，主要从事活动构造和地震预报研究。',
    papers: 180,
    citations: 6000,
  },
  {
    id: 4,
    name: '李小文',
    affiliation: '清华大学',
    research: '地球观测与遥感',
    bio: '李小文院士是清华大学教授，主要从事地球观测和遥感技术研究。',
    papers: 120,
    citations: 4000,
  },
];
