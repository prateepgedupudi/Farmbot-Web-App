jest.mock("react-redux", () => ({ connect: jest.fn() }));

jest.mock("../../../history", () => ({
  getPathArray: jest.fn(() => ["L", "O", "L"]),
  history: { push: jest.fn() }
}));

import React from "react";
import { mount, shallow } from "enzyme";
import { GroupListPanel, GroupListPanelProps } from "../group_list_panel";
import { fakePointGroup } from "../../../__test_support__/fake_state/resources";
import { history } from "../../../history";

describe("<GroupListPanel />", () => {
  const fakeProps = (): GroupListPanelProps => {
    const fake1 = fakePointGroup();
    fake1.body.name = "one";
    fake1.body.id = 9;
    fake1.body.point_ids = [1, 2, 3];

    const fake2 = fakePointGroup();
    fake2.body.name = "two";

    return { dispatch: jest.fn(), groups: [fake1, fake2] };
  };

  it("changes search term", () => {
    const p = fakeProps();
    const wrapper = shallow<GroupListPanel>(<GroupListPanel {...p} />);
    wrapper.find("input").first().simulate("change",
      { currentTarget: { value: "one" } });
    expect(wrapper.state().searchTerm).toEqual("one");
  });

  it("renders relevant group data as a list", () => {
    const p = fakeProps();
    const wrapper = mount(<GroupListPanel {...p} />);
    wrapper.find(".plant-search-item").first().simulate("click");
    expect(history.push).toHaveBeenCalledWith("/app/designer/groups/9");

    ["3 items",
      "0 items",
      p.groups[0].body.name,
      p.groups[1].body.name].map(string =>
        expect(wrapper.text()).toContain(string));
  });

  it("renders no groups", () => {
    const p = fakeProps();
    p.groups = [];
    const wrapper = mount(<GroupListPanel {...p} />);
    expect(wrapper.text().toLowerCase()).toContain("no groups yet");
  });
});
