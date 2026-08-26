import PropTypes from 'prop-types';
import '../../assets/scss/styledark.scss';

// Wraps children with the dark theme stylesheet applied
const ThemeSelector = ({ children }) => {
  return <>{children}</>;
};

// Prop Types
ThemeSelector.propTypes = {
  children: PropTypes.node,
};

export default ThemeSelector;
