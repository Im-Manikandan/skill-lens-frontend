// Imports
import { Button, Col, ButtonGroup, Row } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import SimpleBar from 'simplebar-react';
import PropTypes from 'prop-types';
import {
  ChangeTopbarColor,
  ToggleCustomizer,
  ChangeDirection,
  ChangeSidebarColor,
  ToggleTopbar,
  FixedSidebar,
} from '../../store/customizer/CustomizerSlice';
import { ColorsBg, SidebarColorsBg } from './data';

const Customizer = ({ className }) => {
  // Redux State & Dispatch
  const dispatch = useDispatch();
  const topbarColor = useSelector((state) => state.customizer.topbarBg);
  const direction = useSelector((state) => state.customizer.isRTL);
  const customtoggle = useSelector((state) => state.customizer.customizerSidebar);
  const activeSidebarBg = useSelector((state) => state.customizer.sidebarBg);
  const topbarFixed = useSelector((state) => state.customizer.isTopbarFixed);
  const isSidebarFixed = useSelector((state) => state.customizer.isSidebarFixed);

  return (
    <aside className={`customizerSidebar shadow ${className}`}>
      <Row>
        <Col>
          {/* Panel Header */}
          <div className="p-3 border-bottom">
            <h5 className="mb-0">Theme Customizer</h5>
            <small>Customize & Preview in Real Time</small>
          </div>
          <SimpleBar style={{ height: 'calc(100vh - 85px)' }}>
            <div className="p-3">
              <br />
              {/* Toggle Button */}
              <Button
                color="danger"
                className="custombtn"
                onClick={() => dispatch(ToggleCustomizer())}
              >
                {customtoggle ? <i className="bi bi-x" /> : <i className="bi bi-gear" />}
              </Button>
              {/* Topbar Color Picker */}
              <h6>Topbar Color</h6>
              <div className="button-group">
                {ColorsBg.map((colorbg) => (
                  <Button
                    color={colorbg.bg}
                    key={colorbg.bg}
                    size="sm"
                    onClick={() => dispatch(ChangeTopbarColor(`${colorbg.bg}`))}
                  >
                    {topbarColor === colorbg.bg ? (
                      <i className="bi bi-check" />
                    ) : (
                      <i className="bi bi-circle" />
                    )}
                  </Button>
                ))}
              </div>
              <br />
              <br />

              {/* Direction (LTR / RTL) */}
              <h6>Change Direction</h6>
              <ButtonGroup>
                <Button
                  outline={!!direction}
                  color="primary"
                  size="sm"
                  onClick={() => dispatch(ChangeDirection(false))}
                >
                  LTR
                </Button>
                <Button
                  color="primary"
                  size="sm"
                  outline={!direction}
                  onClick={() => dispatch(ChangeDirection(true))}
                >
                  RTL
                </Button>
              </ButtonGroup>
              <br />
              <br />
              {/* Sidebar Color Picker */}
              <h6>Change sidebar Color</h6>
              <div className="button-group">
                {SidebarColorsBg.map((colorbg) => (
                  <Button
                    color={colorbg.bg}
                    key={colorbg.bg}
                    size="sm"
                    onClick={() => dispatch(ChangeSidebarColor(`${colorbg.bg}`))}
                  >
                    {activeSidebarBg === colorbg.bg ? (
                      <i className="bi bi-check" />
                    ) : (
                      <i className="bi bi-circle" />
                    )}
                  </Button>
                ))}
              </div>
              <br />
              <br />

              {/* Topbar Type (Static / Fixed) */}
              <h6>Topbar Type</h6>

              <ButtonGroup>
                <Button
                  outline={!!topbarFixed}
                  color="primary"
                  size="sm"
                  onClick={() => dispatch(ToggleTopbar(false))}
                >
                  Static
                </Button>
                <Button
                  color="primary"
                  size="sm"
                  outline={!topbarFixed}
                  onClick={() => dispatch(ToggleTopbar(true))}
                >
                  Fixed
                </Button>
              </ButtonGroup>
              <br />
              <br />
              {/* Sidebar Type (Static / Fixed) */}
              <h6>Sidebar Type</h6>

              <ButtonGroup>
                <Button
                  outline={!!isSidebarFixed}
                  color="primary"
                  size="sm"
                  onClick={() => dispatch(FixedSidebar(false))}
                >
                  Static
                </Button>
                <Button
                  color="primary"
                  size="sm"
                  outline={!isSidebarFixed}
                  onClick={() => dispatch(FixedSidebar(true))}
                >
                  Fixed
                </Button>
              </ButtonGroup>
            </div>
          </SimpleBar>
        </Col>
      </Row>
    </aside>
  );
};
// Prop Types
Customizer.propTypes = {
  className: PropTypes.string,
};

export default Customizer;
