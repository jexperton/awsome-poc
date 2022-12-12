import { FC } from "react";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

import Layout from "../components/Layout";
import Add from "../components/dashboard/Add";
import List from "../components/dashboard/List";
import Vocabulary from "../components/dashboard/Vocabulary";

const Dashboard: FC<{}> = () => {
  return (
    <Layout title="Dashboard">
      <Tabs>
        <TabList>
          <Tab>List</Tab>
          <Tab>Add</Tab>
          <Tab>Vocabulary</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <List />
          </TabPanel>
          <TabPanel>
            <Add
              initialTitle={"The World at Six"}
              initialUrl={"https://d3tx5f5u9n7pvg.cloudfront.net/"}
              initialdate={((d) => new Date(d.setDate(d.getDate() - 1)))(
                new Date()
              )}
            />
          </TabPanel>
          <TabPanel>
            <Vocabulary />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Layout>
  );
};

export default Dashboard;
