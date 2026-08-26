// Imports
import { Breadcrumb, BreadcrumbItem } from 'reactstrap';
import { useLocation, Link } from 'react-router';
//import AdminSidebarData from '../sidebars/sidebardata/AdminSidebarData';

const BreadCrumbs = () => {
  // Parse URL Segments
  const location = useLocation();
  const firstUrl = location.pathname.split('/')[1];
  const secondUrl = location.pathname.split('/')[2];
  console.log(firstUrl, secondUrl);
  return (
    <>
      {/* Page Title */}
      <h4 className="text-capitalize">{secondUrl ? `${secondUrl}` : `${firstUrl}`}</h4>
      {/* Breadcrumb Trail */}
      <Breadcrumb>
        <BreadcrumbItem to="/" tag={Link} className="text-decoration-none link-info fw-normal">
          Home
        </BreadcrumbItem>
        {firstUrl ? <BreadcrumbItem active>{firstUrl}</BreadcrumbItem> : ''}
        {secondUrl ? <BreadcrumbItem active>{secondUrl}</BreadcrumbItem> : ''}
      </Breadcrumb>
    </>
  );
};

export default BreadCrumbs;
