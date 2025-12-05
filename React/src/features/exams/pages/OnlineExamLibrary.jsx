import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSkills } from '../api/exams.api';
import './OnlineExamLibrary.css';
import WritingIcon from '../../../assets/images/Writing.png';
import SpeakingIcon from '../../../assets/images/Speaking.png';
import ListeningIcon from '../../../assets/images/Listening.png';
import ReadingIcon from '../../../assets/images/Reading.png';
import SelectExamModeModal from '../components/SelectExamModeModal';

export default function OnlineExamLibrary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    skillType: [],
    difficulty: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(18);

  // State for sidebar collapse/expand
  const [expandedSections, setExpandedSections] = useState({
    writingTask1: false,
    writingTask2: false,
    speakingPart1: false,
    speakingPart2: false,
    speakingPart3: false,
    listeningBaiLe: false,
    listeningFullDe: false,
    readingBaiLe: false,
    readingFullDe: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    fetchSkills();
  }, [currentPage, perPage]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      // Chỉ lấy skills có is_online = true
      const response = await getSkills({ 
        is_online: true,
        page: currentPage,
        per_page: perPage
      });

      if (response.data.success) {
        const responseData = response.data.data;
        const skillsData = responseData.data || responseData;
        
        setSkills(skillsData);
        
        // Set pagination data if available
        if (responseData.current_page) {
          setCurrentPage(responseData.current_page);
          setTotalPages(responseData.last_page);
          setTotalItems(responseData.total);
          setPerPage(responseData.per_page);
        }
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter skills based on search and filters
  const filteredSkills = skills.filter(skill => {
    // Search filter
    const matchesSearch = skill.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.exam_test?.exam?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Skill type filter
    const matchesSkillType = filters.skillType.length === 0 ||
      filters.skillType.includes(skill.skill_type);

    // Task filter
    if (selectedTask !== 'all') {
      if (selectedTask === 'writing' && skill.skill_type !== 'writing') {
        return false;
      }
      if (selectedTask === 'reading' && skill.skill_type !== 'reading') {
        return false;
      }
      if (selectedTask === 'listening' && skill.skill_type !== 'listening') {
        return false;
      }
      if (selectedTask === 'speaking' && skill.skill_type !== 'speaking') {
        return false;
      }
    }

    return matchesSearch && matchesSkillType;
  });

  // Sort skills
  const sortedSkills = [...filteredSkills].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      default:
        return 0;
    }
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value]
    }));
  };

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getSkillImage = (skill) => {
    // Get image from skill only
    if (skill.image) {
      const image = skill.image;
      if (image.startsWith('http')) {
        return image;
      }
      return `${import.meta.env.VITE_API_BASE_URL}/storage/${image}`;
    }

    // Default placeholder based on skill type
    const colors = {
      reading: '3b82f6',
      writing: '10b981',
      listening: 'f59e0b',
      speaking: 'ef4444',
    };
    const color = colors[skill.skill_type] || '6366f1';
    return `https://via.placeholder.com/280x180/${color}/ffffff?text=${skill.skill_type || 'Skill'}`;
  };

  const getSkillTypeLabel = (skillType) => {
    const labels = {
      reading: 'Reading',
      writing: 'Writing',
      listening: 'Listening',
      speaking: 'Speaking',
    };
    return labels[skillType] || skillType;
  };





  return (
    <div className="online-exam-library">
      {/* Header */}
      <div className="online-exam-library__header-wrapper">
        {/* Breadcrumb */}
        <div className="online-exam-library__breadcrumb">
          <span className="online-exam-library__breadcrumb-item" onClick={() => navigate('/')}>Trang chủ</span>
          <span className="online-exam-library__breadcrumb-separator"><svg xmlns="http://www.w3.org/2000/svg" width="16"
            height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10.3602 7.52685L6.58682 3.76019C6.52484 3.6977 6.45111 3.64811 6.36987 3.61426C6.28863 3.58041 6.20149 3.56299 6.11348 3.56299C6.02548 3.56299 5.93834 3.58041 5.8571 3.61426C5.77586 3.64811 5.70213 3.6977 5.64015 3.76019C5.51598 3.8851 5.44629 4.05406 5.44629 4.23019C5.44629 4.40631 5.51598 4.57528 5.64015 4.70019L8.94015 8.03352L5.64015 11.3335C5.51598 11.4584 5.44629 11.6274 5.44629 11.8035C5.44629 11.9796 5.51598 12.1486 5.64015 12.2735C5.70189 12.3365 5.77552 12.3866 5.85677 12.421C5.93802 12.4553 6.02528 12.4732 6.11348 12.4735C6.20169 12.4732 6.28894 12.4553 6.37019 12.421C6.45144 12.3866 6.52507 12.3365 6.58682 12.2735L10.3602 8.50685C10.4278 8.44443 10.4818 8.36866 10.5188 8.28433C10.5557 8.19999 10.5748 8.10892 10.5748 8.01685C10.5748 7.92479 10.5557 7.83372 10.5188 7.74938C10.4818 7.66505 10.4278 7.58928 10.3602 7.52685Z"
              fill="#6D6D6D" />
          </svg></span>
          <span className="online-exam-library__breadcrumb-item online-exam-library__breadcrumb-item--active">Đề thi online</span>
        </div>

        <div className="online-exam-library__header-top">
          <h1 className="online-exam-library__title"> Thư viện đề thi Online</h1>
          <div className="online-exam-library__header-controls">
            <div className="online-exam-library__search">
              <svg
                className="online-exam-library__search-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                className="online-exam-library__search-input"
                placeholder="Tìm kiếm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="online-exam-library__sort">
              <div className="online-exam-library__sort-wrapper">
                <select
                  className="online-exam-library__sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="name">Tên A-Z</option>
                </select>
                <svg className="online-exam-library__sort-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.40845 12.9499L4.70011 8.23328C4.622 8.15581 4.56001 8.06364 4.5177 7.96209C4.4754 7.86054 4.45361 7.75162 4.45361 7.64161C4.45361 7.5316 4.4754 7.42268 4.5177 7.32113C4.56001 7.21958 4.622 7.12741 4.70011 7.04994C4.85625 6.89474 5.06746 6.80762 5.28761 6.80762C5.50777 6.80762 5.71898 6.89474 5.87511 7.04994L10.0418 11.1749L14.1668 7.04994C14.3229 6.89474 14.5341 6.80762 14.7543 6.80762C14.9744 6.80762 15.1856 6.89474 15.3418 7.04994C15.4205 7.12712 15.4832 7.21916 15.5261 7.32072C15.569 7.42229 15.5913 7.53136 15.5918 7.64161C15.5913 7.75187 15.569 7.86094 15.5261 7.9625C15.4832 8.06406 15.4205 8.1561 15.3418 8.23328L10.6334 12.9499C10.5554 13.0345 10.4607 13.102 10.3553 13.1482C10.2499 13.1944 10.136 13.2182 10.0209 13.2182C9.90586 13.2182 9.79202 13.1944 9.68661 13.1482C9.58119 13.102 9.48648 13.0345 9.40845 12.9499Z" fill="#6D6D6D" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="online-exam-library__content">
        {/* Sidebar */}
        <aside className="online-exam-library__sidebar">
          {/* Writing Section */}
          <div className="sidebar-section">
            <div className="sidebar-section__header">
              <img src={WritingIcon} alt="Writing" className="sidebar-section__icon" />
              <h3 className="sidebar-section__title">Writing</h3>
            </div>

            {/* Task 1 */}
            <div className="sidebar-item">
              <button
                className={`sidebar-item__toggle sidebar-item__toggle--writing ${expandedSections.writingTask1 ? 'expanded' : ''}`}
                onClick={() => toggleSection('writingTask1')}
              >
                <span>Task 1</span>
                <span className="sidebar-item__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.40845 7.05006L4.70011 11.7667C4.622 11.8442 4.56001 11.9364 4.5177 12.0379C4.4754 12.1395 4.45361 12.2484 4.45361 12.3584C4.45361 12.4684 4.4754 12.5773 4.5177 12.6789C4.56001 12.7804 4.622 12.8726 4.70011 12.9501C4.85625 13.1053 5.06746 13.1924 5.28761 13.1924C5.50777 13.1924 5.71898 13.1053 5.87511 12.9501L10.0418 8.82506L14.1668 12.9501C14.3229 13.1053 14.5341 13.1924 14.7543 13.1924C14.9744 13.1924 15.1856 13.1053 15.3418 12.9501C15.4205 12.8729 15.4832 12.7808 15.5261 12.6793C15.569 12.5777 15.5913 12.4686 15.5918 12.3584C15.5913 12.2481 15.569 12.1391 15.5261 12.0375C15.4832 11.9359 15.4205 11.8439 15.3418 11.7667L10.6334 7.05006C10.5554 6.96547 10.4607 6.89796 10.3553 6.85179C10.2499 6.80562 10.136 6.78178 10.0209 6.78178C9.90586 6.78178 9.79202 6.80562 9.68661 6.85179C9.58119 6.89796 9.48648 6.96547 9.40845 7.05006Z" fill="#333333" />
                </svg></span>
              </button>
              {expandedSections.writingTask1 && (
                <div className="sidebar-item__content">
                  <div className="sidebar-subitem">
                    <div className="sidebar-subitem__title">NGUỒN TÀI LIỆU</div>
                    <ul className="sidebar-subitem__list">
                      <li>Livestream thầy Khoa</li>
                      <li>Forecast Quý 2/2025</li>
                      <li>C10-C20</li>
                      <li>Recent Actual Tests</li>
                    </ul>
                  </div>
                  <div className="sidebar-subitem">
                    <div className="sidebar-subitem__title">DẠNG ĐỀ</div>
                    <ul className="sidebar-subitem__list">
                      <li> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M2.5 2.5V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H17.5" stroke="#454545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M15.8335 7.5L11.6668 11.6667L8.3335 8.33333L5.8335 10.8333" stroke="#454545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>Line Graph</li>
                      <li> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M5.00007 10.0003H3.43757C2.93757 10.0003 2.53174 10.4062 2.53174 10.9062V16.8028C2.53174 17.3028 2.93757 17.7087 3.43757 17.7087H4.99841C5.49841 17.7087 5.90424 17.3028 5.90424 16.8028V10.9062C5.90424 10.4062 5.49841 10.0003 4.99841 10.0003M10.7809 6.14616H9.22007C8.72007 6.14616 8.31424 6.55199 8.31424 7.05199V16.8028C8.31424 17.3028 8.71924 17.7087 9.21924 17.7087H10.7809C11.2809 17.7087 11.6867 17.3028 11.6867 16.8028V7.05199C11.6867 6.55199 11.2809 6.14616 10.7809 6.14616ZM16.5617 2.29199H15.0009C14.5009 2.29199 14.0951 2.69783 14.0951 3.19783V16.8028C14.0951 17.3028 14.5009 17.7087 15.0009 17.7087H16.5617C17.0617 17.7087 17.4676 17.3028 17.4676 16.8028V3.19783C17.4676 2.69783 17.0617 2.29199 16.5617 2.29199Z" stroke="#454545" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>Bar Chart</li>
                      <li><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10.8332 9.16699H16.6248C16.4193 7.63921 15.7832 6.34477 14.7165 5.28366C13.6554 4.22255 12.3609 3.58644 10.8332 3.37533M9.1665 16.6253V3.37533C7.49984 3.58644 6.11095 4.31977 4.99984 5.57533C3.88873 6.83088 3.33317 8.30588 3.33317 10.0003C3.33317 11.6948 3.88873 13.1698 4.99984 14.4253C6.11095 15.6864 7.49984 16.4198 9.1665 16.6253ZM10.8332 16.6253C12.3609 16.4309 13.6609 15.8003 14.7332 14.7337C15.7998 13.6614 16.4304 12.3614 16.6248 10.8337H10.8332M9.99984 18.3337C8.84984 18.3337 7.7665 18.1142 6.74984 17.6753C5.73873 17.242 4.85817 16.6503 4.10817 15.9003C3.35817 15.1503 2.76373 14.267 2.32484 13.2503C1.88595 12.2392 1.6665 11.1559 1.6665 10.0003C1.6665 8.84477 1.88595 7.76144 2.32484 6.75033C2.76373 5.73921 3.35817 4.85866 4.10817 4.10866C4.85817 3.35866 5.73873 2.76421 6.74984 2.32533C7.7665 1.88644 8.84984 1.66699 9.99984 1.66699C11.1498 1.66699 12.2304 1.88644 13.2415 2.32533C14.2471 2.76421 15.1276 3.36144 15.8832 4.11699C16.6443 4.87255 17.2415 5.7531 17.6748 6.75866C18.1137 7.76977 18.3332 8.85033 18.3332 10.0003C18.3332 11.1392 18.1137 12.217 17.6748 13.2337C17.2415 14.2448 16.6498 15.1281 15.8998 15.8837C15.1498 16.6448 14.2665 17.242 13.2498 17.6753C12.2387 18.1142 11.1554 18.3337 9.99984 18.3337Z" fill="#454545" />
                      </svg>Pie Chart</li>
                      <li><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M15.8333 17.5H4.16667C3.70833 17.5 3.31611 17.3369 2.99 17.0108C2.66389 16.6847 2.50056 16.2922 2.5 15.8333V4.16667C2.5 3.70833 2.66333 3.31611 2.99 2.99C3.31667 2.66389 3.70889 2.50056 4.16667 2.5H15.8333C16.2917 2.5 16.6842 2.66333 17.0108 2.99C17.3375 3.31667 17.5006 3.70889 17.5 4.16667V15.8333C17.5 16.2917 17.3369 16.6842 17.0108 17.0108C16.6847 17.3375 16.2922 17.5006 15.8333 17.5ZM4.16667 6.66667H15.8333V4.16667H4.16667V6.66667ZM6.25 8.33333H4.16667V15.8333H6.25V8.33333ZM13.75 8.33333V15.8333H15.8333V8.33333H13.75ZM12.0833 8.33333H7.91667V15.8333H12.0833V8.33333Z" fill="#454545" />
                      </svg>Table</li>
                      <li><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <g clip-path="url(#clip0_183_120)">
                          <path d="M3.33317 12.5V15.8333M9.99984 7.5V15.8333M18.3332 18.3333H1.6665M16.6665 10.8333V15.8333" stroke="#454545" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                          <path d="M4.66651 7.33368C4.53519 7.15859 4.37067 7.01107 4.18233 6.89956C3.994 6.78804 3.78555 6.71472 3.56888 6.68376C3.35221 6.65281 3.13156 6.66484 2.91954 6.71916C2.70752 6.77348 2.50827 6.86903 2.33318 7.00035C2.15808 7.13167 2.01057 7.29619 1.89905 7.48453C1.78754 7.67286 1.71421 7.88131 1.68326 8.09798C1.62075 8.53556 1.73463 8.98006 1.99984 9.33368C2.26506 9.6873 2.65989 9.92108 3.09748 9.9836C3.53506 10.0461 3.97956 9.93223 4.33318 9.66701C4.6868 9.4018 4.92058 9.00697 4.98309 8.56938C5.04561 8.1318 4.93173 7.6873 4.66651 7.33368ZM4.66651 7.33368L8.66651 4.33368M8.66651 4.33368C8.83689 4.5612 9.06263 4.74135 9.32227 4.85703C9.5819 4.97271 9.86681 5.02007 10.1499 4.9946C10.433 4.96913 10.7049 4.87168 10.9397 4.71151C11.1745 4.55135 11.3645 4.33379 11.4915 4.07951M8.66651 4.33368C8.48865 4.09617 8.37741 3.81549 8.3443 3.52062C8.31119 3.22575 8.3574 2.92738 8.47816 2.65634C8.59892 2.3853 8.78985 2.15142 9.03123 1.97884C9.27261 1.80627 9.55568 1.70126 9.85121 1.67467C10.1467 1.64809 10.444 1.70088 10.7123 1.82759C10.9806 1.95431 11.2102 2.15036 11.3774 2.39549C11.5446 2.64062 11.6434 2.92595 11.6634 3.222C11.6835 3.51804 11.6241 3.81407 11.4915 4.07951M11.4915 4.07951L15.1748 5.92118M15.1748 5.92118C15.0769 6.11696 15.0185 6.33011 15.0029 6.54847C14.9873 6.76683 15.0149 6.98612 15.0841 7.19381C15.2238 7.61327 15.5244 7.96004 15.9198 8.15785C16.3152 8.35565 16.773 8.38829 17.1925 8.24858C17.6119 8.10886 17.9587 7.80824 18.1565 7.41285C18.3502 7.01804 18.3801 6.56267 18.2395 6.14595C18.099 5.72924 17.7994 5.38497 17.4061 5.18816C17.0129 4.99136 16.5577 4.95797 16.1399 5.09527C15.7221 5.23257 15.3755 5.52944 15.1757 5.92118H15.1748Z" stroke="#454545" stroke-width="1.5" />
                        </g>
                        <defs>
                          <clipPath id="clip0_183_120">
                            <rect width="20" height="20" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>Mixed Graph</li>
                      <li><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M2.5 5.16667C2.5 4.23333 2.5 3.76667 2.68167 3.41C2.84145 3.09641 3.09641 2.84145 3.41 2.68167C3.76667 2.5 4.23333 2.5 5.16667 2.5H14.8333C15.7667 2.5 16.2333 2.5 16.59 2.68167C16.9036 2.84145 17.1585 3.09641 17.3183 3.41C17.5 3.76667 17.5 4.23333 17.5 5.16667V14.8333C17.5 15.7667 17.5 16.2333 17.3183 16.59C17.1585 16.9036 16.9036 17.1585 16.59 17.3183C16.2333 17.5 15.7667 17.5 14.8333 17.5H5.16667C4.23333 17.5 3.76667 17.5 3.41 17.3183C3.09641 17.1585 2.84145 16.9036 2.68167 16.59C2.5 16.2333 2.5 15.7667 2.5 14.8333V5.16667Z" stroke="#454545" stroke-width="2" stroke-linecap="round" />
                        <path d="M15.8333 17.5L12.5 5.41667M17.5 5L2.5 6.66667M10.8333 11.74C10.8333 13.2733 9.38417 14.3608 8.6925 14.7933C8.58491 14.861 8.46041 14.8968 8.33333 14.8968C8.20626 14.8968 8.08176 14.861 7.97417 14.7933C7.2825 14.3608 5.83333 13.2725 5.83333 11.74C5.83333 10.1958 7.045 9.16667 8.33333 9.16667C9.66667 9.16667 10.8333 10.1958 10.8333 11.74Z" stroke="#454545" stroke-width="2" />
                      </svg>Map</li>
                      <li><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4.9999 17.9162C4.45901 17.9161 3.92882 17.7655 3.46856 17.4814C3.0083 17.1973 2.63612 16.7908 2.3936 16.3073C2.15108 15.8238 2.04778 15.2825 2.09523 14.7436C2.14269 14.2048 2.33904 13.6899 2.66234 13.2562C2.98564 12.8226 3.42315 12.4874 3.92599 12.2881C4.42882 12.0888 4.97717 12.0333 5.50976 12.1277C6.04235 12.2221 6.53819 12.4627 6.94188 12.8227C7.34557 13.1827 7.6412 13.6479 7.79574 14.1662H12.4999V12.4996H14.1666V7.70122L12.2974 5.83289H7.4999V7.49956H2.4999V2.49956H7.4999V4.16622H12.2974L14.9999 1.46289L18.5357 4.99956L15.8332 7.70039V12.4996H17.4999V17.4996H12.4999V15.8329H7.79574C7.61624 16.4349 7.24715 16.9629 6.74339 17.3383C6.23964 17.7137 5.62814 17.9164 4.9999 17.9162ZM4.9999 13.7496C4.66838 13.7496 4.35044 13.8813 4.11602 14.1157C3.8816 14.3501 3.7499 14.668 3.7499 14.9996C3.7499 15.3311 3.8816 15.649 4.11602 15.8834C4.35044 16.1179 4.66838 16.2496 4.9999 16.2496C5.33142 16.2496 5.64937 16.1179 5.88379 15.8834C6.11821 15.649 6.2499 15.3311 6.2499 14.9996C6.2499 14.668 6.11821 14.3501 5.88379 14.1157C5.64937 13.8813 5.33142 13.7496 4.9999 13.7496ZM15.8332 14.1662H14.1666V15.8329H15.8332V14.1662ZM14.9999 3.82122L13.8216 4.99956L14.9999 6.17789L16.1782 4.99956L14.9999 3.82122ZM5.83324 4.16622H4.16657V5.83289H5.83324V4.16622Z" fill="#454545" />
                      </svg>Process</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Task 2 */}
            <div className="sidebar-item">
              <button
                className={`sidebar-item__toggle sidebar-item__toggle--writing ${expandedSections.writingTask2 ? 'expanded' : ''}`}
                onClick={() => toggleSection('writingTask2')}
              >
                <span>Task 2</span>
                <span className="sidebar-item__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.40845 7.05006L4.70011 11.7667C4.622 11.8442 4.56001 11.9364 4.5177 12.0379C4.4754 12.1395 4.45361 12.2484 4.45361 12.3584C4.45361 12.4684 4.4754 12.5773 4.5177 12.6789C4.56001 12.7804 4.622 12.8726 4.70011 12.9501C4.85625 13.1053 5.06746 13.1924 5.28761 13.1924C5.50777 13.1924 5.71898 13.1053 5.87511 12.9501L10.0418 8.82506L14.1668 12.9501C14.3229 13.1053 14.5341 13.1924 14.7543 13.1924C14.9744 13.1924 15.1856 13.1053 15.3418 12.9501C15.4205 12.8729 15.4832 12.7808 15.5261 12.6793C15.569 12.5777 15.5913 12.4686 15.5918 12.3584C15.5913 12.2481 15.569 12.1391 15.5261 12.0375C15.4832 11.9359 15.4205 11.8439 15.3418 11.7667L10.6334 7.05006C10.5554 6.96547 10.4607 6.89796 10.3553 6.85179C10.2499 6.80562 10.136 6.78178 10.0209 6.78178C9.90586 6.78178 9.79202 6.80562 9.68661 6.85179C9.58119 6.89796 9.48648 6.96547 9.40845 7.05006Z" fill="#333333" />
                </svg></span>
              </button>
              {expandedSections.writingTask2 && (
                <div className="sidebar-item__content">
                  <div className="sidebar-subitem">
                    <div className="sidebar-subitem__title">NGUỒN TÀI LIỆU</div>
                    <ul className="sidebar-subitem__list">
                      <li>Forecast Quý 2/2025</li>
                      <li>Livestream thầy Khoa</li>
                      <li>C10-C20</li>
                      <li>Recent Actual Tests</li>
                    </ul>
                  </div>
                  <div className="sidebar-subitem">
                    <div className="sidebar-subitem__title">DẠNG ĐỀ</div>
                    <ul className="sidebar-subitem__list">
                      <li>Agree or Disagree</li>
                      <li>Discussion</li>
                      <li>Advantages and Disadvantages</li>
                      <li>Causes, Problems and Solutions</li>
                      <li>Two-Part Question</li>
                      <li>Positive or Negative Development</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Speaking Section */}
          <div className="sidebar-section">
            <div className="sidebar-section__header">
              <img src={SpeakingIcon} alt="Speaking" className="sidebar-section__icon" />
              <h3 className="sidebar-section__title">Speaking</h3>
            </div>
            <div className="sidebar-item">
              <button
                className={`sidebar-item__toggle sidebar-item__toggle--speaking ${expandedSections.speakingPart1 ? 'expanded' : ''}`}
                onClick={() => toggleSection('speakingPart1')}
              >
                <span>Part 1</span>
                <span className="sidebar-item__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.40845 7.05006L4.70011 11.7667C4.622 11.8442 4.56001 11.9364 4.5177 12.0379C4.4754 12.1395 4.45361 12.2484 4.45361 12.3584C4.45361 12.4684 4.4754 12.5773 4.5177 12.6789C4.56001 12.7804 4.622 12.8726 4.70011 12.9501C4.85625 13.1053 5.06746 13.1924 5.28761 13.1924C5.50777 13.1924 5.71898 13.1053 5.87511 12.9501L10.0418 8.82506L14.1668 12.9501C14.3229 13.1053 14.5341 13.1924 14.7543 13.1924C14.9744 13.1924 15.1856 13.1053 15.3418 12.9501C15.4205 12.8729 15.4832 12.7808 15.5261 12.6793C15.569 12.5777 15.5913 12.4686 15.5918 12.3584C15.5913 12.2481 15.569 12.1391 15.5261 12.0375C15.4832 11.9359 15.4205 11.8439 15.3418 11.7667L10.6334 7.05006C10.5554 6.96547 10.4607 6.89796 10.3553 6.85179C10.2499 6.80562 10.136 6.78178 10.0209 6.78178C9.90586 6.78178 9.79202 6.80562 9.68661 6.85179C9.58119 6.89796 9.48648 6.96547 9.40845 7.05006Z" fill="#333333" />
                </svg></span>
              </button>
            </div>
            <div className="sidebar-item">
              <button
                className={`sidebar-item__toggle sidebar-item__toggle--speaking ${expandedSections.speakingPart2 ? 'expanded' : ''}`}
                onClick={() => toggleSection('speakingPart2')}
              >
                <span>Part 2</span>
                <span className="sidebar-item__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.40845 7.05006L4.70011 11.7667C4.622 11.8442 4.56001 11.9364 4.5177 12.0379C4.4754 12.1395 4.45361 12.2484 4.45361 12.3584C4.45361 12.4684 4.4754 12.5773 4.5177 12.6789C4.56001 12.7804 4.622 12.8726 4.70011 12.9501C4.85625 13.1053 5.06746 13.1924 5.28761 13.1924C5.50777 13.1924 5.71898 13.1053 5.87511 12.9501L10.0418 8.82506L14.1668 12.9501C14.3229 13.1053 14.5341 13.1924 14.7543 13.1924C14.9744 13.1924 15.1856 13.1053 15.3418 12.9501C15.4205 12.8729 15.4832 12.7808 15.5261 12.6793C15.569 12.5777 15.5913 12.4686 15.5918 12.3584C15.5913 12.2481 15.569 12.1391 15.5261 12.0375C15.4832 11.9359 15.4205 11.8439 15.3418 11.7667L10.6334 7.05006C10.5554 6.96547 10.4607 6.89796 10.3553 6.85179C10.2499 6.80562 10.136 6.78178 10.0209 6.78178C9.90586 6.78178 9.79202 6.80562 9.68661 6.85179C9.58119 6.89796 9.48648 6.96547 9.40845 7.05006Z" fill="#333333" />
                </svg></span>
              </button>
            </div>
            <div className="sidebar-item">
              <button
                className={`sidebar-item__toggle sidebar-item__toggle--speaking ${expandedSections.speakingPart3 ? 'expanded' : ''}`}
                onClick={() => toggleSection('speakingPart3')}
              >
                <span>Part 3</span>
                <span className="sidebar-item__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.40845 7.05006L4.70011 11.7667C4.622 11.8442 4.56001 11.9364 4.5177 12.0379C4.4754 12.1395 4.45361 12.2484 4.45361 12.3584C4.45361 12.4684 4.4754 12.5773 4.5177 12.6789C4.56001 12.7804 4.622 12.8726 4.70011 12.9501C4.85625 13.1053 5.06746 13.1924 5.28761 13.1924C5.50777 13.1924 5.71898 13.1053 5.87511 12.9501L10.0418 8.82506L14.1668 12.9501C14.3229 13.1053 14.5341 13.1924 14.7543 13.1924C14.9744 13.1924 15.1856 13.1053 15.3418 12.9501C15.4205 12.8729 15.4832 12.7808 15.5261 12.6793C15.569 12.5777 15.5913 12.4686 15.5918 12.3584C15.5913 12.2481 15.569 12.1391 15.5261 12.0375C15.4832 11.9359 15.4205 11.8439 15.3418 11.7667L10.6334 7.05006C10.5554 6.96547 10.4607 6.89796 10.3553 6.85179C10.2499 6.80562 10.136 6.78178 10.0209 6.78178C9.90586 6.78178 9.79202 6.80562 9.68661 6.85179C9.58119 6.89796 9.48648 6.96547 9.40845 7.05006Z" fill="#333333" />
                </svg></span>
              </button>
            </div>
          </div>

          {/* Listening Section */}
          <div className="sidebar-section">
            <div className="sidebar-section__header">
              <img src={ListeningIcon} alt="Listening" className="sidebar-section__icon" />
              <h3 className="sidebar-section__title">Listening</h3>
            </div>

            {/* Bài lẻ */}
            <div className="sidebar-item">
              <button
                className={`sidebar-item__toggle sidebar-item__toggle--listening ${expandedSections.listeningBaiLe ? 'expanded' : ''}`}
                onClick={() => toggleSection('listeningBaiLe')}
              >
                <span>Bài lẻ</span>
                <span className="sidebar-item__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.40845 7.05006L4.70011 11.7667C4.622 11.8442 4.56001 11.9364 4.5177 12.0379C4.4754 12.1395 4.45361 12.2484 4.45361 12.3584C4.45361 12.4684 4.4754 12.5773 4.5177 12.6789C4.56001 12.7804 4.622 12.8726 4.70011 12.9501C4.85625 13.1053 5.06746 13.1924 5.28761 13.1924C5.50777 13.1924 5.71898 13.1053 5.87511 12.9501L10.0418 8.82506L14.1668 12.9501C14.3229 13.1053 14.5341 13.1924 14.7543 13.1924C14.9744 13.1924 15.1856 13.1053 15.3418 12.9501C15.4205 12.8729 15.4832 12.7808 15.5261 12.6793C15.569 12.5777 15.5913 12.4686 15.5918 12.3584C15.5913 12.2481 15.569 12.1391 15.5261 12.0375C15.4832 11.9359 15.4205 11.8439 15.3418 11.7667L10.6334 7.05006C10.5554 6.96547 10.4607 6.89796 10.3553 6.85179C10.2499 6.80562 10.136 6.78178 10.0209 6.78178C9.90586 6.78178 9.79202 6.80562 9.68661 6.85179C9.58119 6.89796 9.48648 6.96547 9.40845 7.05006Z" fill="#333333" />
                </svg></span>
              </button>
              {expandedSections.listeningBaiLe && (
                <div className="sidebar-item__content">
                  <div className="sidebar-subitem">
                    <div className="sidebar-subitem__title">NGUỒN TÀI LIỆU</div>
                    <ul className="sidebar-subitem__list">
                      <li>Forecast Quý 2/2025</li>
                      <li>Trainer & Practice Tests+</li>
                      <li>C10-C20</li>
                      <li>Recent Actual Tests</li>
                    </ul>
                  </div>
                  <div className="sidebar-subitem">
                    <div className="sidebar-subitem__title">SECTION</div>
                    <ul className="sidebar-subitem__list">
                      <li>Section 1</li>
                      <li>Section 2</li>
                      <li>Section 3</li>
                      <li>Section 4</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Full đề */}
            <div className="sidebar-item">
              <button
                className={`sidebar-item__toggle sidebar-item__toggle--listening ${expandedSections.listeningFullDe ? 'expanded' : ''}`}
                onClick={() => toggleSection('listeningFullDe')}
              >
                <span>Full đề</span>
                <span className="sidebar-item__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.40845 7.05006L4.70011 11.7667C4.622 11.8442 4.56001 11.9364 4.5177 12.0379C4.4754 12.1395 4.45361 12.2484 4.45361 12.3584C4.45361 12.4684 4.4754 12.5773 4.5177 12.6789C4.56001 12.7804 4.622 12.8726 4.70011 12.9501C4.85625 13.1053 5.06746 13.1924 5.28761 13.1924C5.50777 13.1924 5.71898 13.1053 5.87511 12.9501L10.0418 8.82506L14.1668 12.9501C14.3229 13.1053 14.5341 13.1924 14.7543 13.1924C14.9744 13.1924 15.1856 13.1053 15.3418 12.9501C15.4205 12.8729 15.4832 12.7808 15.5261 12.6793C15.569 12.5777 15.5913 12.4686 15.5918 12.3584C15.5913 12.2481 15.569 12.1391 15.5261 12.0375C15.4832 11.9359 15.4205 11.8439 15.3418 11.7667L10.6334 7.05006C10.5554 6.96547 10.4607 6.89796 10.3553 6.85179C10.2499 6.80562 10.136 6.78178 10.0209 6.78178C9.90586 6.78178 9.79202 6.80562 9.68661 6.85179C9.58119 6.89796 9.48648 6.96547 9.40845 7.05006Z" fill="#333333" />
                </svg></span>
              </button>
            </div>
          </div>

          {/* Reading Section */}
          <div className="sidebar-section">
            <div className="sidebar-section__header">
              <img src={ReadingIcon} alt="Reading" className="sidebar-section__icon" />
              <h3 className="sidebar-section__title">Reading</h3>
            </div>

            {/* Bài lẻ */}
            <div className="sidebar-item">
              <button
                className={`sidebar-item__toggle sidebar-item__toggle--reading ${expandedSections.readingBaiLe ? 'expanded' : ''}`}
                onClick={() => toggleSection('readingBaiLe')}
              >
                <span>Bài lẻ</span>
                <span className="sidebar-item__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.40845 7.05006L4.70011 11.7667C4.622 11.8442 4.56001 11.9364 4.5177 12.0379C4.4754 12.1395 4.45361 12.2484 4.45361 12.3584C4.45361 12.4684 4.4754 12.5773 4.5177 12.6789C4.56001 12.7804 4.622 12.8726 4.70011 12.9501C4.85625 13.1053 5.06746 13.1924 5.28761 13.1924C5.50777 13.1924 5.71898 13.1053 5.87511 12.9501L10.0418 8.82506L14.1668 12.9501C14.3229 13.1053 14.5341 13.1924 14.7543 13.1924C14.9744 13.1924 15.1856 13.1053 15.3418 12.9501C15.4205 12.8729 15.4832 12.7808 15.5261 12.6793C15.569 12.5777 15.5913 12.4686 15.5918 12.3584C15.5913 12.2481 15.569 12.1391 15.5261 12.0375C15.4832 11.9359 15.4205 11.8439 15.3418 11.7667L10.6334 7.05006C10.5554 6.96547 10.4607 6.89796 10.3553 6.85179C10.2499 6.80562 10.136 6.78178 10.0209 6.78178C9.90586 6.78178 9.79202 6.80562 9.68661 6.85179C9.58119 6.89796 9.48648 6.96547 9.40845 7.05006Z" fill="#333333" />
                </svg></span>
              </button>
              {expandedSections.readingBaiLe && (
                <div className="sidebar-item__content">
                  <div className="sidebar-subitem">
                    <div className="sidebar-subitem__title">NGUỒN TÀI LIỆU</div>
                    <ul className="sidebar-subitem__list">
                      <li>Forecast Quý 2/2025</li>
                      <li>Trainer & Practice Tests+</li>
                      <li>C10-C20</li>
                      <li>Recent Actual Tests</li>
                    </ul>
                  </div>
                  <div className="sidebar-subitem">
                    <div className="sidebar-subitem__title">PASSAGE</div>
                    <ul className="sidebar-subitem__list">
                      <li>Passage 1</li>
                      <li>Passage 2</li>
                      <li>Passage 3</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Full đề */}
            <div className="sidebar-item">
              <button
                className={`sidebar-item__toggle sidebar-item__toggle--reading ${expandedSections.readingFullDe ? 'expanded' : ''}`}
                onClick={() => toggleSection('readingFullDe')}
              >
                <span>Full đề</span>
                <span className="sidebar-item__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.40845 7.05006L4.70011 11.7667C4.622 11.8442 4.56001 11.9364 4.5177 12.0379C4.4754 12.1395 4.45361 12.2484 4.45361 12.3584C4.45361 12.4684 4.4754 12.5773 4.5177 12.6789C4.56001 12.7804 4.622 12.8726 4.70011 12.9501C4.85625 13.1053 5.06746 13.1924 5.28761 13.1924C5.50777 13.1924 5.71898 13.1053 5.87511 12.9501L10.0418 8.82506L14.1668 12.9501C14.3229 13.1053 14.5341 13.1924 14.7543 13.1924C14.9744 13.1924 15.1856 13.1053 15.3418 12.9501C15.4205 12.8729 15.4832 12.7808 15.5261 12.6793C15.569 12.5777 15.5913 12.4686 15.5918 12.3584C15.5913 12.2481 15.569 12.1391 15.5261 12.0375C15.4832 11.9359 15.4205 11.8439 15.3418 11.7667L10.6334 7.05006C10.5554 6.96547 10.4607 6.89796 10.3553 6.85179C10.2499 6.80562 10.136 6.78178 10.0209 6.78178C9.90586 6.78178 9.79202 6.80562 9.68661 6.85179C9.58119 6.89796 9.48648 6.96547 9.40845 7.05006Z" fill="#333333" />
                </svg></span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="online-exam-library__main">
          {loading ? (
            <div className="online-exam-library__loading">Đang tải dữ liệu...</div>
          ) : sortedSkills.length === 0 ? (
            <div className="online-exam-library__empty">Không có bài thi nào</div>
          ) : (
            <>
              <div className="online-exam-library__grid">
                {sortedSkills.map(skill => (
                  <div
                    key={skill.id}
                    className="online-exam-library__card"
                    onClick={() => handleSkillClick(skill)}
                  >
                    <img
                      src={getSkillImage(skill)}
                      alt={skill.name}
                      className="online-exam-library__card-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/280x180/6366f1/ffffff?text=No+Image';
                      }}
                    />
                    <div className="online-exam-library__card-content">
                      <h3 className="online-exam-library__card-title">{skill.name}</h3>
                      <p className="online-exam-library__card-subtitle">
                        Tiền trình: <span className="online-exam-library__card-skill-type">{getSkillTypeLabel(skill.skill_type)}</span>

                      </p>
                      <div className="online-exam-library__card-footer">
                        <button className="online-exam-library__card-button">
                          Thi ngay
                          <span className="online-exam-library__card-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M9.93333 4.68674C9.89367 4.58445 9.8342 4.491 9.75833 4.41174L5.59167 0.245076C5.51397 0.167378 5.42173 0.105744 5.32021 0.0636935C5.21869 0.0216433 5.10988 0 5 0C4.77808 0 4.56525 0.0881567 4.40833 0.245076C4.33063 0.322775 4.269 0.415017 4.22695 0.516535C4.1849 0.618054 4.16326 0.72686 4.16326 0.836743C4.16326 1.05866 4.25141 1.27149 4.40833 1.42841L7.15833 4.17008H0.833333C0.61232 4.17008 0.400358 4.25787 0.244078 4.41415C0.0877975 4.57044 0 4.7824 0 5.00341C0 5.22442 0.0877975 5.43639 0.244078 5.59267C0.400358 5.74895 0.61232 5.83674 0.833333 5.83674H7.15833L4.40833 8.57841C4.33023 8.65588 4.26823 8.74805 4.22592 8.8496C4.18362 8.95115 4.16183 9.06007 4.16183 9.17008C4.16183 9.28009 4.18362 9.38901 4.22592 9.49056C4.26823 9.59211 4.33023 9.68427 4.40833 9.76174C4.4858 9.83985 4.57797 9.90185 4.67952 9.94415C4.78107 9.98646 4.88999 10.0082 5 10.0082C5.11001 10.0082 5.21893 9.98646 5.32048 9.94415C5.42203 9.90185 5.5142 9.83985 5.59167 9.76174L9.75833 5.59508C9.8342 5.51582 9.89367 5.42237 9.93333 5.32008C10.0167 5.11719 10.0167 4.88963 9.93333 4.68674Z" fill="#045CCE" />
                          </svg></span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="online-exam-library__pagination">
                  <button 
                    className="online-exam-library__pagination-btn online-exam-library__pagination-btn--prev"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M14.1669 9.16715H7.84191L10.5919 6.42548C10.7488 6.26856 10.837 6.05573 10.837 5.83381C10.837 5.6119 10.7488 5.39907 10.5919 5.24215C10.435 5.08523 10.2222 4.99707 10.0002 4.99707C9.77832 4.99707 9.56549 5.08523 9.40857 5.24215L5.24191 9.40881C5.16604 9.48807 5.10657 9.58152 5.06691 9.68381C4.98356 9.8867 4.98356 10.1143 5.06691 10.3171C5.10657 10.4194 5.16604 10.5129 5.24191 10.5921L9.40857 14.7588C9.48604 14.8369 9.57821 14.8989 9.67976 14.9412C9.78131 14.9835 9.89023 15.0053 10.0002 15.0053C10.1102 15.0053 10.2192 14.9835 10.3207 14.9412C10.4223 14.8989 10.5144 14.8369 10.5919 14.7588C10.67 14.6813 10.732 14.5892 10.7743 14.4876C10.8166 14.3861 10.8384 14.2772 10.8384 14.1671C10.8384 14.0571 10.8166 13.9482 10.7743 13.8467C10.732 13.7451 10.67 13.653 10.5919 13.5755L7.84191 10.8338H14.1669C14.3879 10.8338 14.5999 10.746 14.7562 10.5897C14.9124 10.4335 15.0002 10.2215 15.0002 10.0005C15.0002 9.77947 14.9124 9.56751 14.7562 9.41122C14.5999 9.25494 14.3879 9.16715 14.1669 9.16715Z" fill="#6D6D6D"/>
                    </svg>
                    <span>Trang đầu</span>
                  </button>

                  <div className="online-exam-library__pagination-numbers">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      // Show first 2 pages, last 2 pages, current page and 1 page around current
                      const showPage = 
                        page === 1 || 
                        page === 2 || 
                        page === totalPages || 
                        page === totalPages - 1 ||
                        page === currentPage ||
                        page === currentPage - 1 ||
                        page === currentPage + 1;

                      if (showPage) {
                        return (
                          <button
                            key={page}
                            className={`online-exam-library__pagination-number ${
                              page === currentPage ? 'active' : ''
                            }`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        (page === 3 && currentPage > 4) ||
                        (page === totalPages - 2 && currentPage < totalPages - 3)
                      ) {
                        return <span key={page} className="online-exam-library__pagination-dots">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button 
                    className="online-exam-library__pagination-btn online-exam-library__pagination-btn--next"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <span>Trang cuối</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M14.9333 9.68381C14.8937 9.58152 14.8342 9.48807 14.7583 9.40881L10.5917 5.24215C10.514 5.16445 10.4217 5.10281 10.3202 5.06076C10.2187 5.01871 10.1099 4.99707 10 4.99707C9.77808 4.99707 9.56525 5.08523 9.40833 5.24215C9.33063 5.31985 9.269 5.41209 9.22695 5.51361C9.1849 5.61512 9.16326 5.72393 9.16326 5.83381C9.16326 6.05573 9.25141 6.26856 9.40833 6.42548L12.1583 9.16715H5.83333C5.61232 9.16715 5.40036 9.25494 5.24408 9.41122C5.0878 9.56751 5 9.77947 5 10.0005C5 10.2215 5.0878 10.4335 5.24408 10.5897C5.40036 10.746 5.61232 10.8338 5.83333 10.8338H12.1583L9.40833 13.5755C9.33023 13.653 9.26823 13.7451 9.22592 13.8467C9.18362 13.9482 9.16183 14.0571 9.16183 14.1671C9.16183 14.2772 9.18362 14.3861 9.22592 14.4876C9.26823 14.5892 9.33023 14.6813 9.40833 14.7588C9.4858 14.8369 9.57797 14.8989 9.67952 14.9412C9.78107 14.9835 9.88999 15.0053 10 15.0053C10.11 15.0053 10.2189 14.9835 10.3205 14.9412C10.422 14.8989 10.5142 14.8369 10.5917 14.7588L14.7583 10.5921C14.8342 10.5129 14.8937 10.4194 14.9333 10.3171C15.0167 10.1143 15.0167 9.8867 14.9333 9.68381Z" fill="#6D6D6D"/>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Select Exam Mode Modal */}
      <SelectExamModeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        skill={selectedSkill}
      />
    </div>
  );
}
