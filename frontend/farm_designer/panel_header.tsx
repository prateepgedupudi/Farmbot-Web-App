import * as React from "react";
import { getPathArray } from "../history";
import { Link } from "../link";
import { DevSettings } from "../account/dev/dev_support";
import { t } from "../i18next_wrapper";

export enum Panel {
  Map = "Map",
  Plants = "Plants",
  FarmEvents = "FarmEvents",
  SavedGardens = "SavedGardens",
  Tools = "Tools",
  Settings = "Settings",
  Points = "Points",
  Groups = "Groups",
}

type Tabs = keyof typeof Panel;

export const TAB_COLOR: { [key in Panel]: string } = {
  [Panel.Map]: "gray",
  [Panel.Plants]: "green",
  [Panel.FarmEvents]: "yellow",
  [Panel.SavedGardens]: "green",
  [Panel.Tools]: "gray",
  [Panel.Settings]: "gray",
  [Panel.Points]: "gray",
  [Panel.Groups]: "blue",
};

const iconFile = (icon: string) => `/app-resources/img/icons/${icon}.svg`;

export const TAB_ICON: { [key in Panel]: string } = {
  [Panel.Map]: iconFile("map"),
  [Panel.Plants]: iconFile("plant"),
  [Panel.FarmEvents]: iconFile("calendar"),
  [Panel.SavedGardens]: iconFile("gardens"),
  [Panel.Tools]: iconFile("tool"),
  [Panel.Settings]: iconFile("settings"),
  [Panel.Points]: iconFile("point"),
  [Panel.Groups]: iconFile("groups"),
};

const getCurrentTab = (): Tabs => {
  const pathArray = getPathArray();
  if (pathArray.join("/") === "/app/designer") {
    return Panel.Map;
  } else if (pathArray.includes("events")) {
    return Panel.FarmEvents;
  } else if (pathArray.includes("saved_gardens")) {
    return Panel.SavedGardens;
  } else if (pathArray.includes("tools")) {
    return Panel.Tools;
  } else if (pathArray.includes("settings")) {
    return Panel.Settings;
  } else if (pathArray.includes("points")) {
    return Panel.Points;
  } else if (pathArray.includes("groups")) {
    return Panel.Groups;
  } else {
    return Panel.Plants;
  }
};

const common = { width: 30, height: 30 };

interface NavTabProps {
  panel: Panel;
  linkTo: string;
  title: string;
  icon?: string;
}

const NavTab = (props: NavTabProps) =>
  <Link to={props.linkTo} style={(props.icon
    && !DevSettings.futureFeaturesEnabled()) ? { flex: 0.3 } : {}}
    className={getCurrentTab() === props.panel ? "active" : ""}>
    {DevSettings.futureFeaturesEnabled()
      ? <img {...common}
        src={TAB_ICON[props.panel]} title={props.title} />
      : props.icon ? <i className={props.icon} /> : props.title}
  </Link>;

export function DesignerNavTabs(props: { hidden?: boolean }) {
  const tab = getCurrentTab();
  const hidden = props.hidden ? "hidden" : "";
  return <div className={`panel-nav ${TAB_COLOR[tab]}-panel ${hidden}`}>
    <div className="panel-tabs">
      <NavTab panel={Panel.Map}
        linkTo={"/app/designer"} title={t("Map")} />
      <NavTab panel={Panel.Plants}
        linkTo={"/app/designer/plants"} title={t("Plants")} />
      <NavTab panel={Panel.FarmEvents}
        linkTo={"/app/designer/events"} title={t("Events")} />
      {DevSettings.futureFeaturesEnabled() &&
        <NavTab panel={Panel.SavedGardens}
          linkTo={"/app/designer/saved_gardens"} title={t("Gardens")} />}
      {DevSettings.futureFeaturesEnabled() &&
        <NavTab panel={Panel.Points}
          linkTo={"/app/designer/points"} title={t("Points")} />}
      {DevSettings.futureFeaturesEnabled() &&
        <NavTab panel={Panel.Groups}
          linkTo={"/app/designer/groups"} title={t("Groups")} />}
      {DevSettings.futureFeaturesEnabled() &&
        <NavTab panel={Panel.Tools}
          linkTo={"/app/designer/tools"} title={t("Tools")} />}
      <NavTab panel={Panel.Settings} icon={"fa fa-gear"}
        linkTo={"/app/designer/settings"} title={t("Settings")} />
    </div>
  </div>;
}
