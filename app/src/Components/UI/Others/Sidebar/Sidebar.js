import React from "react";
import { Link } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { IconBxHome, IconClipboardOutline, IconGalleryLine, IconPeople16, IconRankingChart, IconStatsChart, IconUserAdd } from "../../../../utils/Svgs";

function Sidebar({ }) {

  return (
    <aside className={styles.Sidebar}>
      <div className={styles.logo}>
        <a href="/">
          <img src="/logo.png" alt="" />
        </a>
      </div>
      <div className={styles.sidebarContainer}>
        <div>
          <Link
            className={styles.sidebarEl}
            to={"/dashboard"}
          >
            <div className={styles.hoverField}>
              <h4>Dashboard</h4>
            </div>
            <i>
              <IconBxHome />
            </i>
            {/* <h1>Home</h1> */}
          </Link>
        </div>
        <div>
          <Link
            className={styles.sidebarEl}
            to="/dashboard/stats"
          >
            <div className={styles.hoverField}>
              <h4>Stats</h4>
            </div>
            <i>
              <IconStatsChart />
            </i>
            {/* <h1>Stats</h1> */}
          </Link>
        </div>
        <div>
          <Link
            className={styles.sidebarEl}
            to={"/dashboard/planner"}
          >
            <div className={styles.hoverField}>
              <h4>Planner</h4>
            </div>
            <i>
              <IconClipboardOutline />
            </i>
            {/* <h1>Planner</h1> */}
          </Link>
        </div>
        <div>
          <Link
            className={styles.sidebarEl}
            to={"/dashboard/ranking"}
          >
            <div className={styles.hoverField}>
              <h4>Rank</h4>
            </div>
            <i>
              <IconRankingChart />
            </i>
            {/* <h1>Rank</h1> */}
          </Link>
        </div>
        <div>
          <Link
            className={styles.sidebarEl}
            to={"/dashboard/groups"}
          >
            <div className={styles.hoverField}>
              <h4>Groups</h4>
            </div>
            <i>
              <IconPeople16 />
            </i>
            {/* <h1>Groups</h1> */}
          </Link>
        </div>
        <div>
          <Link
            className={styles.sidebarEl}
            to={"/dashboard/friends"}
          >
            <div className={styles.hoverField}>
              <h4>Friends</h4>
            </div>
            <i>
              <IconUserAdd />
            </i>
            {/* <h1>Friends</h1> */}
          </Link>
        </div>
        <div>
          <Link
            className={styles.sidebarEl}
            to={"/dashboard/themes"}
          >
            <div className={styles.hoverField}>
              <h4>Themes</h4>
            </div>
            <i>
              <IconGalleryLine />
            </i>
            {/* <h1>Themes</h1> */}
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
