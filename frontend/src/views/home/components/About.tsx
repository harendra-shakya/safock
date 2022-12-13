import { Trans } from "@lingui/macro";
import { SmallButton } from "components/button";
import { useNavigate } from "react-router-dom";
import { Box, BoxProps, Grid, Link, Text } from "theme-ui";
import { ROUTES } from "utils/constants";

/**
 * Section: Home > About footer
 */
const About = (props: BoxProps) => {
    const navigate = useNavigate();

    const handleDeploy = () => {
        navigate(ROUTES.DEPLOY);
        document.getElementById("app-container")?.scrollTo(0, 0);
    };

    return (
        <Box {...props}>
            <Grid columns={[1, 1, 2]} mt={6} pl={4} gap={[4, 4, 7]}>
                <Box>
                    <Text variant="title" mb={3} sx={{ fontSize: 4 }}>
                        <Trans>Create New ETF</Trans>
                    </Text>

                    <SmallButton py={2} mt={3} mb={4} onClick={handleDeploy}>
                        <Trans>Create ETF</Trans>
                    </SmallButton>
                </Box>
            </Grid>
        </Box>
    );
};

export default About;
