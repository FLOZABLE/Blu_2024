import React, { useState, useEffect, useRef, useContext } from "react";
import styles from "./Groups.module.css";
import GroupsGen from "../../UI/GroupsGen/GroupsGen";
import { GroupsContext, ResponseContext, UserInfoContext, WorkoutsContext } from "../../../Contexts";
import BlobBtn from "../../UI/Buttons/BlobBtn/BlobBtn";
import CreateGroupModal from "../../UI/Modals/CreateGroupModal/CreateGroupModal";
import MyGroupsViewer from "../../UI/Groups/MyGroupsViewer/MyGroupsViewer";
import SearchBar from "../../UI/Inputs/SearchBar/SearchBar";
import TagContainerGen from "../../UI/Inputs/TagContainerGen/TagContainerGen";
import GroupPwModal from "../../UI/Modals/GroupPwModal/GroupPwModal";

function Groups({
}) {

  const {userInfo} = useContext(UserInfoContext);
  const {workouts} = useContext(WorkoutsContext);
  const {otherGroups, setOtherGroups, myGroups, setMyGroups} = useContext(GroupsContext);
  const {setResponse} = useContext(ResponseContext);

  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroupPwModal, setIsGroupPwModal] = useState(false);
  const [joinTarget, setJoinTarget] = useState(null);
  const [myTimerTotal, setMyTimerTotal] = useState(0);
  const [isCreateNewGroup, setIsCreateNewGroup] = useState(false);
  const [joinByLink, setJoinByLink] = useState(false);

  const groupsViewerRef = useRef(null);

  const handleCreatedTagsChange = (tags) => {
    setTags(tags);
  };

  useEffect(() => {
    if (
      workouts.daily &&
      workouts.daily.groupedTotal[workouts.daily.groupedTotal.length - 1]
    ) {
      setMyTimerTotal(
        workouts.daily.groupedTotal[workouts.daily.groupedTotal.length - 1],
      );
    }
  }, [workouts]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const selectedGroupId = searchParams.get("joinId");

    if (!selectedGroupId) return;

    otherGroups.map((group) => {
      if (group.group_id === selectedGroupId) {
        setJoinTarget({ ...group });
        setIsGroupPwModal(true);
        setJoinByLink(true);
      }
    });
  }, [otherGroups]);

  return (
    <div>
      <CreateGroupModal
        isOpen={isCreateNewGroup}
        setIsOpen={setIsCreateNewGroup}
      />
      <GroupPwModal
        myGroups={myGroups}
        setMyGroups={setMyGroups}
        groups={otherGroups}
        setOtherGroups={setOtherGroups}
        setIsGroupPwModal={setIsGroupPwModal}
        isGroupPwModal={isGroupPwModal}
        joinTarget={joinTarget}
        setJoinGroupResponse={setResponse}
        joinByLink={joinByLink}
        setJoinByLink={setJoinByLink}
        userInfo={userInfo}
        groupsViewerRef={groupsViewerRef}
      />

      <div
        className={`Main`}
      >
        <div className="title">
          Groups
        </div>
        <div className={styles.Groups}>
          <div className={styles.box}>
            <MyGroupsViewer
              myGroups={myGroups}
              myTimerTotal={myTimerTotal}
              groupsViewerRef={groupsViewerRef}
            />
          </div>
          <div className={styles.box}>
            <div className={styles.searchOpt}>
              <div>
                <div className={styles.tagContainerWrapper}>
                  <TagContainerGen
                    maxTags={10}
                    setTags={setTags}
                    handleCreatedTagsChange={handleCreatedTagsChange}
                  />
                </div>
              </div>
              <div>
                <div className={styles.searchWrapper}>
                  <SearchBar
                    setSearchQuery={setSearchQuery}
                    searchQuery={searchQuery}
                  />
                </div>
              </div>
              <div>
                <BlobBtn
                  name={"+ Create new group"}
                  setClicked={() => {
                    setIsCreateNewGroup(!isCreateNewGroup);
                  }}
                  color1={"#fff"}
                  color2={"var(--purple2)"}
                />
              </div>
            </div>
            <div className={styles.groupsWrapper}>
              <GroupsGen
                myGroups={myGroups}
                setMyGroups={setMyGroups}
                groups={otherGroups}
                setOtherGroups={setOtherGroups}
                setJoinGroupResponse={setResponse}
                setIsGroupPwModal={setIsGroupPwModal}
                setJoinTarget={setJoinTarget}
                setJoinByLink={setJoinByLink}
                searchQuery={searchQuery}
                userInfo={userInfo}
                queryTags={tags}
                groupsViewerRef={groupsViewerRef}
                setResponse={setResponse}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Groups;