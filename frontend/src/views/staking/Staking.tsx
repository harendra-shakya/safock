import { Trans } from "@lingui/macro";
import { Container } from "components";
import { Box, Grid, Text } from "theme-ui";
import Balances from "./components/balances";
import Overview from "./components/overview";
import Stake from "./components/stake";
import Unstake from "./components/unstake";

const Staking = () => (
    <Container pb={4}>
        <Text ml={5} mb={4} variant="strong" sx={{ display: "block" }}>
            <Trans>Stake + Unstake</Trans>
        </Text>
        <Box>
            <Grid columns={[1, 2]} gap={4} mb={4}>
                <Stake />
                <Unstake />
            </Grid>
            <Balances />
        </Box>
    </Container>
);

export default Staking;
