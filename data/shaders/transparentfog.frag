#ifdef Use_Bindless_Texture
layout(bindless_sampler) uniform sampler2D tex;
#else
uniform sampler2D tex;
#endif


uniform float fogmax;
uniform float startH;
uniform float endH;
uniform float start;
uniform float end;
uniform vec3 col;
uniform samplerCube probe;

in vec2 uv;
in vec4 color;
in vec3 nor;
out vec4 FragColor;


vec3 DiffuseIBL(vec3 normal, vec3 V, float roughness, vec3 color);

vec3 SpecularIBL(vec3 normal, vec3 V, float roughness, vec3 transparency);

vec3 SpecularBRDF(vec3 normal, vec3 eyedir, vec3 lightdir, vec3 color, float roughness);
vec3 DiffuseBRDF(vec3 normal, vec3 eyedir, vec3 lightdir, vec3 color, float roughness);
vec3 SunMRP(vec3 normal, vec3 eyedir);

void main()
{
    vec4 diffusecolor = texture(tex, uv);
#ifdef Use_Bindless_Texture
    diffusecolor.xyz = pow(diffusecolor.xyz, vec3(2.2));
#endif
    diffusecolor.xyz *= pow(color.xyz, vec3(2.2));
    diffusecolor.a *= color.a;
    vec3 tmp = vec3(gl_FragCoord.xy / screen, gl_FragCoord.z);
    tmp = 2. * tmp - 1.;

    vec4 xpos = vec4(tmp, 1.0);
    xpos = InverseProjectionMatrix * xpos;
    xpos.xyz /= xpos.w;

    /* Compute lighting ------------ */
    vec3 eyedir = -normalize(xpos.xyz);
    vec3 normal = normalize(nor);

    vec3 Lightdir = SunMRP(normal, eyedir);
    float NdotL = clamp(dot(normal, Lightdir), 0., 1.);

    //diffusecolor.rgb = DiffuseIBL(normal);
    //diffusecolor.rgb = SpecularIBL(normal, eyedir, 0.); // TODO add transparency vec3(0.04) * diffusecolor.a
    
    diffusecolor.rgb =
        0.2 * (DiffuseIBL(normal, eyedir, 0., diffusecolor.rgb) + SpecularIBL(normal, eyedir, 0., vec3(0.04) * diffusecolor.a)) +
        sun_col * NdotL * 
        (DiffuseBRDF(normal, eyedir, Lightdir, diffusecolor.rgb, 0.) + SpecularBRDF(normal, eyedir, Lightdir, vec3(.04) * diffusecolor.a, 0.));

    /* End of light computation -----*/


    float dist = length(xpos.xyz);
    float fog = smoothstep(start, end, dist);

    fog = min(fog, fogmax);

    vec4 finalcolor = vec4(col, 0.) * fog + diffusecolor *(1. - fog);
    
    diffusecolor.rgb = SpecularIBL(normal, eyedir, 0., vec3(0.04) * diffusecolor.a);
    
    //FragColor = vec4(finalcolor.rgb * finalcolor.a, finalcolor.a);
    
    FragColor = vec4(fog * diffusecolor.a + diffusecolor.rgb, diffusecolor.a);
}
