import React from 'react';
import {ReactComponent as LogoDarkText} from '../../assets/images/logos/skill_lens_logo_text.svg';

// Full-text logo displayed on authentication pages
const AuthLogo = () => {
    return (
        <div className="p-4 d-flex align-items-center justify-content-center gap-2">
            <LogoDarkText/>
        </div>
    );
};

export default AuthLogo;
