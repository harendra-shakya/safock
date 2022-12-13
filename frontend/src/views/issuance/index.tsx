import { Trans } from "@lingui/macro";
import { Container } from "components";
import { Box, Grid, Text } from "theme-ui";
import About from "./components/about";
import Balances from "./components/balances";
import Issue from "./components/issue";
import Redeem from "./components/redeem";

/**
 * Mint & Redeem view
 */
const Issuance = () => (
    <Container pb={4}>
        <Text ml={5} mb={4} variant="strong" sx={{ fontSize: 4 }}>
            <Trans>Mint + Redeem</Trans>
        </Text>
        <Box>
            <Grid columns={[1, 2]} gap={4} mb={4}>
                <Issue />
                <Redeem />
            </Grid>
            <Balances />
        </Box>
    </Container>
);

export default Issuance;
