// Imports
import { Outlet } from 'react-router';
import { useSelector } from 'react-redux';
import { Container } from 'reactstrap';
import Header from './header/Header';
import Sidebar from './sidebars/vertical/Sidebar';

const FullLayout = () => {
  // Redux State
  const toggleMiniSidebar = useSelector((state) => state.customizer.isMiniSidebar);
  const showMobileSidebar = useSelector((state) => state.customizer.isMobileSidebar);
  const topbarFixed = useSelector((state) => state.customizer.isTopbarFixed);
  return (
    <main style={{backgroundColor: 'var(--sl-bg-main)'}}>
      <div
        className={`pageWrapper d-md-block d-lg-flex ${toggleMiniSidebar ? 'isMiniSidebar' : ''}`}
      >
        {/* Sidebar */}
        <aside className={`sidebarArea ${showMobileSidebar ? 'showSidebar' : ''}`}>
          <Sidebar />
        </aside>

        {/* Content Area */}
        <div className={`contentArea ${topbarFixed ? 'fixedTopbar' : ''}`}>
          {/* Header */}
          <Header />
          {/* Main Content */}
          <Container fluid className="p-4 boxContainer" >
            <div>
              <Outlet />
            </div>
            {showMobileSidebar ? <div className="sidebarOverlay" /> : ''}
          </Container>
        </div>
      </div>
    </main>
  );
};

export default FullLayout;
