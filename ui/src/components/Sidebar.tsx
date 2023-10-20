import Link from "next/link";
import { FiUser } from "react-icons/fi";
import { RiHospitalFill } from "react-icons/ri";
import { TbReportMedical } from "react-icons/tb";
import React, { useContext } from 'react';
import UserTypeContext from '../contexts/UserTypeContext';
import { FaUser, FaBuilding, FaStethoscope } from 'react-icons/fa';

const NavigationBar = () => {
  const { userRole } = useContext(UserTypeContext);
  return (
    <div className="sidenav flex-col flex w-48">
      <div className="links-container ml-10">

        <div>
            <button id="doctorBtn" className="circular-button">
                <FaUser />
            </button>
            <button id="healthinsurerBtn" className="circular-button">
                <FaBuilding />
            </button>
            <button id="patientBtn" className="circular-button">
                <FaStethoscope />
            </button>
        </div>

        {userRole === 'doctor' && <Link className="nav-item mt-5" href="/patients">
          <button className="btn-col-main hover:bg-blue-700 text-white py-2 px-4 rounded">
            <RiHospitalFill /> Patients
          </button>
        </Link>}

        {userRole === 'health insurer' && <Link className="nav-item mt-5" href="/new-request">
          <button className="btn-col-main hover:bg-blue-700 text-white py-2 px-4 rounded">
            <TbReportMedical /> New Request
          </button>
        </Link>}

        {userRole === 'user' && <Link className="nav-item mt-5" href="/user-request">
          <button className="btn-col-main hover:bg-blue-700 text-white py-2 px-4 rounded">
            <TbReportMedical /> Requests
          </button>
        </Link>}

        <Link className="nav-item mt-5" href="/profiles">
          <button className="bg-white text-black py-2 px-4 rounded">
            <FiUser /> Profile
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Header
