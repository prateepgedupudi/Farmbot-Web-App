import * as React from "react";
import { connect } from "react-redux";
import { PointInventoryItem } from "./point_inventory_item";
import { Everything } from "../../interfaces";
import { DesignerNavTabs, Panel } from "../panel_header";
import {
  EmptyStateWrapper, EmptyStateGraphic
} from "../../ui/empty_state_wrapper";
import { Content } from "../../constants";
import {
  DesignerPanel, DesignerPanelContent, DesignerPanelTop
} from "./designer_panel";
import { selectAllGenericPointers } from "../../resources/selectors";
import { TaggedGenericPointer } from "farmbot";
import { t } from "../../i18next_wrapper";

export interface PointsProps {
  points: TaggedGenericPointer[];
  dispatch: Function;
}

interface PointsState {
  searchTerm: string;
}

export function mapStateToProps(props: Everything): PointsProps {
  return {
    points: selectAllGenericPointers(props.resources.index)
      .filter(x => !x.body.discarded_at),
    dispatch: props.dispatch,
  };
}

@connect(mapStateToProps)
export class Points extends React.Component<PointsProps, PointsState> {

  state: PointsState = { searchTerm: "" };

  update = ({ currentTarget }: React.SyntheticEvent<HTMLInputElement>) => {
    this.setState({ searchTerm: currentTarget.value });
  }

  render() {
    return <DesignerPanel panelName={"point-inventory"} panelColor={"brown"}>
      <DesignerNavTabs />
      <DesignerPanelTop
        panel={Panel.Points}
        linkTo={"/app/designer/points/add"}
        title={t("Add point")}>
        <input type="text" onChange={this.update}
          placeholder={t("Search your points...")} />
      </DesignerPanelTop>
      <DesignerPanelContent panelName={"point"}>
        <EmptyStateWrapper
          notEmpty={this.props.points.length > 0}
          graphic={EmptyStateGraphic.no_crop_results}
          title={t("No points yet.")}
          text={Content.NO_POINTS}
          colorScheme={"points"}>
          {this.props.points
            .filter(p => p.body.name.toLowerCase()
              .includes(this.state.searchTerm.toLowerCase()))
            .map(p => {
              return <PointInventoryItem
                key={p.uuid}
                tpp={p}
                dispatch={this.props.dispatch} />;
            })}
        </EmptyStateWrapper>
      </DesignerPanelContent>
    </DesignerPanel>;
  }
}
